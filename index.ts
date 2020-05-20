import {
  Verb,
  Subject,
  SubjectName,
  SubjectOrTest,
  Test,
  Options,
  Policy,
} from './types'

const assumeGlobal = (sub: any): boolean =>
  typeof sub === 'boolean' ||
  typeof sub === 'undefined' ||
  (typeof sub === 'function' && sub.name === '')

/**
 * Simple ACL library for the browser inspired by Laravel's guards and policies.
 */
class Acl {
  static GlobalRule = 'GLOBAL_RULE'

  strict: boolean
  rules: Map<SubjectName, { [key: string]: Test }>
  policies: Map<SubjectName | undefined, Policy>
  registry: WeakMap<Object, string>

  /**
   * browser-acl
   *
   * @access public
   */
  constructor({ strict = false }: Options = {}) {
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
   */
  rule(verbs: Verb | Verb[], subject: SubjectOrTest, test: Test = true) {
    let subject_: Subject
    if (assumeGlobal(subject)) {
      test = typeof subject === 'undefined' ? true : (subject as Test)
      subject_ = Acl.GlobalRule
    } else {
      subject_ = subject as Subject
    }
    const subjectName = this.subjectMapper(subject_)
    const verbs_ = Array.isArray(verbs) ? verbs : [verbs]
    verbs_.forEach((verb) => {
      const rules = this.rules.get(subjectName) || {}
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
   *       this.delete = false    // not really necessary since an abscent
   *                              // verb has the same result
   *     }
   *     beforeAll(verb, user, ...theRest) {
   *       if (user.isAdmin) {
   *         return true
   *       }
   *       // return nothing (undefined) to pass it on to the other rules
   *     }
   *     edit(user, post, verb, additionalParameter, secondAdditionalParameter) {
   *       return post.id === user.id
   *     }
   *   }
   * ```
   *
   * Policies are useful for grouping rules and adding more complex logic.
   *
   * @access public
   */
  policy(policy: Policy, subject: Subject) {
    const policy_ =
      typeof policy === 'function' ? new (policy as any)() : policy
    const subjectName = this.subjectMapper(subject)
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
   */
  register(klass: Function, subjectName: string) {
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
   *   acl.can(user, 'create', Post)
   *   acl.can(user, 'edit', post)
   *   acl.can(user, 'edit', post, additionalParameter, secondAdditionalParameter)
   * ```
   *
   * Note that these are also available on the user if you've used
   * the mixin:
   *
   * ```javascript
   *   user.can('create', Post)
   *   user.can('edit', post)
   * ```
   *
   * @access public
   */
  can(
    user: Object,
    verb: Verb,
    subject: Subject | undefined = undefined,
    ...args: any[]
  ) {
    subject = typeof subject === 'undefined' ? Acl.GlobalRule : subject
    const subjectName = this.subjectMapper(subject)

    const policy = this.policies.get(subjectName)
    const rules = policy || this.rules.get(subjectName)

    if (typeof rules === 'undefined') {
      if (this.strict) {
        throw new Error(`No rules for subject "${subjectName}"`)
      }
      return false
    }

    if (policy && typeof policy.beforeAll === 'function') {
      const result = policy.beforeAll(verb, user, subject, subjectName, ...args)
      if (typeof result !== 'undefined') {
        return result
      }
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
   */
  some(user: object, verb: Verb, subjects: Subject[], ...args: any[]) {
    return subjects.some((s) => this.can(user, verb, s, ...args))
  }

  /**
   * Like can but subject is an array where all has to be
   * true for the rule to match.
   *
   * Note the subjects do not need to be of the same kind.
   *
   * @access public
   */
  every(user: Object, verb: Verb, subjects: Subject[], ...args: any[]) {
    return subjects.every((s) => this.can(user, verb, s, ...args))
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
   */
  mixin(User: Function) {
    const acl = this
    User.prototype.can = function (
      verb: Verb,
      subject: Subject,
      ...args: any[]
    ) {
      return acl.can(this, verb, subject, ...args)
    }
    User.prototype.can.every = function (
      verb: Verb,
      subjects: Subject[],
      ...args: any[]
    ) {
      return acl.every(this, verb, subjects, ...args)
    }
    User.prototype.can.some = function (
      verb: Verb,
      subjects: Subject[],
      ...args: any[]
    ) {
      return acl.some(this, verb, subjects, ...args)
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
   * - object's constructor name is used for subject
   *
   * Override this function if your models do not match this approach.
   *
   * E.g. say that you are using plain data objects with a type property
   * to indicate the type of the object.
   *
   * ```javascript
   *   acl.subjectMapper = s => typeof s === 'string' ? s : s.type
   * ```
   *
   * `can` will now use this function when you pass in your objects.
   *
   * ```javascript
   * acl.rule('edit', 'book', (user, book) => user.id === book.authorId)
   * const thing = {title: 'The Silmarillion', authorId: 1, type: 'book'}
   * acl.can(user, 'edit', thing)
   * ```
   *
   * In the example above the 'thing' will follow the rules for 'book'. The
   * user can edit the book if they are the author.
   *
   * See {@link #register register()} for how to manually map
   * classes to subject name.
   *
   * @access public
   */
  subjectMapper(subject: Subject): SubjectName {
    if (typeof subject === 'string') {
      return subject
    }
    if (this.registry.has(subject)) {
      return this.registry.get(subject)
    }
    if (this.registry.has(subject.constructor)) {
      return this.registry.get(subject.constructor)
    }
    if (typeof subject === 'function') {
      return subject.name
    }
    return subject.constructor.name
  }

  /**
   * Removes all rules, policies, and registrations
   */
  reset() {
    this.rules = new Map()
    this.policies = new Map()
    this.registry = new WeakMap()
    return this
  }

  /**
   * Remove rules for subject
   *
   * Optionally limit to a single verb.
   */
  removeRules(subject: Subject, verb: Verb | null = null) {
    const subjectName = this.subjectMapper(subject)
    if (this.rules.has(subjectName)) {
      if (verb) {
        const rules = this.rules.get(subjectName)
        if (rules) {
          delete rules[verb]
        }
        return this
      }
      this.rules.delete(subjectName)
    }
    return this
  }

  /**
   * Remove policy for subject
   */
  removePolicy(subject: Subject) {
    const subjectName = this.subjectMapper(subject)
    this.policies.delete(subjectName)
    return this
  }

  /**
   * Convenience method for removing all rules and policies for a subject
   */
  removeAll(subject: Subject) {
    this.removeRules(subject)
    this.removePolicy(subject)
    return this
  }
}

export default Acl
