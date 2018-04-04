/** @prettier */
/** @flow */

export type AclSubject = Function | Object | string
export type AclTest = (
  user: Object,
  subject: mixed,
  subjectName: string,
  ...additional: Array<mixed>
) => boolean
export type AclVerbMap = {[verb: string]: AclTest}

export const GlobalRule: string = 'GLOBAL_RULE'

/**
 * Simple ACL library for the browser inspired by Laravel's guards and policies.
 */
export default class Acl {
  strict: boolean = false
  rules: Map<string, AclVerbMap>
  policies: Map<string, AclVerbMap>
  registry: WeakMap<Function, string>

  /**
   * browser-acl
   *
   * @access public
   * @param {Object} options
   * @param {Boolean} {strict=false}={} Errors out on unknown verbs when true
   * @returns {Acl}
   */
  constructor({strict = false}: {strict: boolean} = {}) {
    this.strict = strict
    this.rules = new Map()
    this.policies = new Map()
    this.registry = new WeakMap()
  }

  /**
   * You add rules by providing a verb, a subject and an optional
   * test (that otherwise defaults to true).
   *
   * If the test is a function it will be evaluated with the params:
   * user, subject, and subjectName. The test value is ultimately evaluated
   * for truthiness.
   *
   * Examples:
   *
   * ```javascript
   * acl.rule('create', Post)
   * acl.rule('edit', Post, (user, post) => post.userId === user.id)
   * acl.rule('edit', Post, (user, post, verb, additionalParameter, secondAdditionalParameter) => true)
   * acl.rule('delete', Post, false) // deleting disabled
   * acl.rule('purgeInactive', user => user.isAdmin) // global rule
   * ```
   *
   * @access public
   * @param {Array<string>|string} verbs
   * @param {Function|Object|string} subject?
   * @param {Boolean|Function} test=true
   * @returns {Acl}
   */
  rule(verbs: Array<string> | string, subject: AclSubject, test: AclTest = () => true): Acl {
    if (typeof subject === 'function' && subject.name === '') {
      ;[subject, test] = [GlobalRule, subject]
    }
    const subjectName = this.subjectMapper(subject)
    if (!subjectName) throw new Error('Unable to determine subject name for subject')
    const verbs_ = Array.isArray(verbs) ? verbs : [verbs]
    verbs_.forEach(verb => {
      const rules = this.rules.get(subjectName) || ({}: AclVerbMap)
      rules[verb] = test
      this.rules.set(subjectName, rules)
    })
    return this
  }

  /**
   * You can group related rules into policies for a subject. The policies
   * properties are verbs and they can plain values or functions.
   *
   * If the policy is a function it will be new'ed up before use.
   *
   * ```javascript
   *   class Post {
   *     constructor() {
   *       this.view = true       // no need for a functon
   *
   *       this.delete = false    // not really necessary since an abscent
   *                              // verb has the same result
   *     },
   *     edit(user, post, verb, additionalParameter, secondAdditionalParameter) {
   *       return post.id === user.id
   *     }
   *   }
   * ```
   *
   * Policies are useful for grouping rules and adding more complex logic.
   *
   * @access public
   * @param {Object} policy A policy with properties that are verbs
   * @param {Function|Object|string} subject
   * @returns {Acl}
   */
  policy(policy: Function | Object, subject: AclSubject): Acl {
    const policy_ = typeof policy === 'function' ? new policy() : policy
    const subjectName = this.subjectMapper(subject)
    if (!subjectName) throw new Error('Unable to determine subject name for subject')
    this.policies.set(subjectName, policy_)
    return this
  }

  /**
   * Explicitly map a class or constructor function to a name.
   *
   * You would want to do this in case your code is heavily
   * minified in which case the default mapper cannot use the
   * simple "reflection" to resolve the subject name.
   *
   * Note: If you override the subjectMapper this is not used,
   * bud it can be used manually through `this.registry`.
   *
   * @access public
   * @param {Function} klass A class or constructor function
   * @param {string} subjectName
   */
  register(klass: Function, subjectName: string): Acl {
    this.registry.set(klass, subjectName)
    return this
  }

  /**
   * Performs a test if a user can perform action on subject.
   *
   * The action is a verb and the subject can be anything the
   * subjectMapper can map to a subject name.
   *
   * E.g. if you can to test if a user can delete a post you would
   * pass the actual post. Where as if you are testing us a user
   * can create a post you would pass the class function or a
   * string.
   *
   * ```javascript
   *   acl->can(user, 'create', Post)
   *   acl->can(user, 'edit', post)
   *   acl->can(user, 'edit', post, additionalParameter, secondAdditionalParameter)
   * ```
   *
   * Note that these are also available on the user if you've used
   * the mixin:
   *
   * ```javascript
   *   user->can('create', Post)
   *   user->can('edit', post)
   * ```
   *
   * @access public
   * @param {Object} user
   * @param {string} verb
   * @param {Function|Object|string} subject
   * @param {...*} args Any other param is passed into rule
   * @return Boolean
   */
  can(user: Object, verb: string, subject: AclSubject, ...args: Array<any>): boolean {
    subject = typeof subject === 'undefined' ? GlobalRule : subject
    const subjectName = this.subjectMapper(subject)

    if (!subjectName) throw new Error('Unable to determine subject name for subject')

    const rules = this.policies.get(subjectName) || this.rules.get(subjectName)

    if (typeof rules === 'undefined') {
      if (this.strict) {
        throw new Error(`Unknown subject "${subjectName}"`)
      }
      return false
    }

    if (typeof rules[verb] === 'function') {
      return Boolean(rules[verb](user, subject, subjectName, ...args))
    }

    if (this.strict && typeof rules[verb] === 'undefined') {
      throw new Error(`Unknown verb "${verb}"`)
    }

    return Boolean(rules[verb])
  }

  /**
   * Like can but subject is an array where only some has to be
   * true for the rule to match.
   *
   * Note the subjects do not need to be of the same kind.
   *
   * @access public
   * @param {Object} user
   * @param {Array<Function|Object|string>} subjects
   * @param {...*} args Any other param is passed into rule
   * @return Boolean
   */
  some(user: Object, verb: string, subjects: Array<AclSubject>, ...args: Array<any>): boolean {
    return subjects.some(s => this.can(user, verb, s, ...args))
  }

  /**
   * Like can but subject is an array where all has to be
   * true for the rule to match.
   *
   * Note the subjects do not need to be of the same kind.
   *
   * @access public
   * @param {Object} user
   * @param {Array<Function|Object|string>} subjects
   * @param {...*} args Any other param is passed into rule
   * @return Boolean
   */
  every(user: Object, verb: string, subjects: Array<AclSubject>, ...args: Array<any>): boolean {
    return subjects.every(s => this.can(user, verb, s, ...args))
  }

  /**
   * Mix in augments your user class with a `can` function object. This
   * is optional and you can always call `can` directly on your
   * Acl instance.
   *
   * ```
   * user.can()
   * user.can.some()
   * user.can.every()
   * ```
   *
   * @access public
   * @param {Function} User A user class or contructor function
   */
  mixin(User: Function): Acl {
    const acl = this
    User.prototype.can = function() {
      return acl.can(this, ...arguments)
    }
    User.prototype.can.every = function() {
      return acl.every(this, ...arguments)
    }
    User.prototype.can.some = function() {
      return acl.some(this, ...arguments)
    }
    return this
  }

  /**
   * Rules are grouped by subjects and this default mapper tries to
   * map any non falsy input to a subject name.
   *
   * This is important when you want to try a verb against a rule
   * passing in an instance of a class.
   *
   * - strings becomes subjects
   * - function's names are used for subject
   * - objects's constructor name is used for subject
   *
   * Override this function if your models do not match this approach.
   *
   * E.g. say that you are using plain data objects with a type property
   * to indicate the "class" of the object.
   *
   * ```javascript
   *   acl.subjectMapper = s => typeof s === 'string' ? s : s.type
   * ```
   *
   * `can` will now use this function when you pass in your objects.
   *
   * See {@link #register register()} for how to manually map
   * classes to subject name.
   *
   * @access public
   * @param {Function|Object|string} subject
   * @returns {?string} A subject
   */
  subjectMapper(subject: AclSubject): ?string {
    if (typeof subject === 'string') return subject
    if (typeof subject === 'function' && this.registry.has(subject)) {
      return this.registry.get(subject)
    }
    if (typeof subject !== 'function' && this.registry.has(subject.constructor)) {
      return this.registry.get(subject.constructor)
    }
    return typeof subject === 'function' ? subject.name : subject.constructor.name
  }

  /**
   * Removes all rules, policies, and registrations
   *
   * @returns {Acl}
   */
  reset(): Acl {
    this.rules = new Map()
    this.policies = new Map()
    this.registry = new WeakMap()
    return this
  }

  /**
   * Remove rules for subject
   *
   * Optionally limit to a single verb.
   *
   * @param {Object|Function|String} subject
   * @param {?String} [verb=null] an optional verb
   * @returns {Acl}
   */
  removeRules(subject: AclSubject, verb?: string): Acl {
    const subjectName = this.subjectMapper(subject)
    if (subjectName && this.rules.has(subjectName)) {
      if (verb) {
        const rules = this.rules.get(subjectName)
        if (rules) delete rules[verb]
        return this
      }
      this.rules.delete(subjectName)
    }
    return this
  }

  /**
   * Remove policy for subject
   *
   * @param {Object|Function|String} subject
   * @returns {Acl}
   */
  removePolicy(subject: AclSubject): Acl {
    const subjectName = this.subjectMapper(subject)
    if (subjectName) this.policies.delete(subjectName)
    return this
  }

  /**
   * Convenience method for removing all rules and policies for a subject
   *
   * @param {Object|Function|String} subject
   * @returns {Acl}
   */
  removeAll(subject: AclSubject): Acl {
    this.removeRules(subject)
    this.removePolicy(subject)
    return this
  }
}
