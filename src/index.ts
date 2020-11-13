import { Verb, VerbObject, Test, Policy, Options } from '../types'

type VerbObjectName = string | undefined

type VerbObjectOrTest = VerbObject | boolean

const assumeGlobal = (obj: any): boolean =>
  typeof obj === 'boolean' ||
  typeof obj === 'undefined' ||
  (typeof obj === 'function' && obj.name === '')

const asyncSome = async (items: any[], test: Function): Promise<boolean> => {
  for (let item of items) {
    if (await test(item)) return true
  }
  return false
}

const asyncEvery = async (items: any[], test: Function): Promise<boolean> => {
  for (let item of items) {
    if (!(await test(item))) return false
  }
  return true
}

/**
 * Simple ACL library for the browser inspired by Laravel's guards and policies.
 *
 * Examples:
 *
 * ```javascript
 * acl.rule('create', Post)
 * acl.rule('edit', Post, (user, post) => post.userId === user.id)
 * ```
 */
class Acl {
  static GlobalRule = 'GLOBAL_RULE'

  strict: boolean
  rules: Map<VerbObjectName, { [key: string]: Test }>
  policies: Map<VerbObjectName | undefined, Policy>
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
   * You add rules by providing a verb, a verb object and an optional
   * test (that otherwise defaults to true).
   *
   * If the test is a function it will be evaluated with the params:
   * user, verbObject, and verbObjectName. The test value is ultimately evaluated
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
  rule(verbs: Verb | Verb[], verbObject: VerbObjectOrTest, test: Test = true) {
    let verbObject_: VerbObject
    if (assumeGlobal(verbObject)) {
      test = typeof verbObject === 'undefined' ? true : (verbObject as Test)
      verbObject_ = Acl.GlobalRule
    } else {
      verbObject_ = verbObject as VerbObject
    }
    const verbObjectName = this.verbObjectMapper(verbObject_)
    const verbs_ = Array.isArray(verbs) ? verbs : [verbs]
    verbs_.forEach((verb) => {
      const rules = this.rules.get(verbObjectName) || {}
      rules[verb] = test
      this.rules.set(verbObjectName, rules)
    })
    return this
  }

  /**
   * You can group related rules into policies for a verb object. The policies
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
  policy(policy: Policy, verbObject: VerbObject) {
    const policy_ =
      typeof policy === 'function' ? new (policy as any)() : policy
    const verbObjectName = this.verbObjectMapper(verbObject)
    this.policies.set(verbObjectName, policy_)
    return this
  }

  /**
   * Explicitly map a class or constructor function to a name.
   *
   * You would want to do this in case your code is heavily
   * minified in which case the default mapper cannot use the
   * simple "reflection" to resolve the verb object name.
   *
   * Note: If you override the verbObjectMapper this is not used,
   * bud it can be used manually through `this.registry`.
   *
   * @access public
   */
  register(klass: Function, verbObjectName: string) {
    this.registry.set(klass, verbObjectName)
    return this
  }

  /**
   * Performs a test if a user can perform action on verb object.
   *
   * The action is a verb and the verb object can be anything the
   * verbObjectMapper can map to a verb object name.
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
  async can(
    user: Object,
    verb: Verb,
    verbObject: VerbObject | undefined = undefined,
    ...args: any[]
  ): Promise<boolean> {
    verbObject = typeof verbObject === 'undefined' ? Acl.GlobalRule : verbObject
    const verbObjectName = this.verbObjectMapper(verbObject)

    const policy = this.policies.get(verbObjectName)
    const rules = policy || this.rules.get(verbObjectName)

    if (typeof rules === 'undefined') {
      if (this.strict) {
        throw new Error(`No rules for verb object "${verbObjectName}"`)
      }
      return false
    }

    if (policy && typeof policy.beforeAll === 'function') {
      const result = await policy.beforeAll(
        verb,
        user,
        verbObject,
        verbObjectName,
        ...args,
      )
      if (typeof result !== 'undefined') {
        return result
      }
    }

    if (typeof rules[verb] === 'function') {
      return Boolean(
        await rules[verb](user, verbObject, verbObjectName, ...args),
      )
    }

    if (this.strict && typeof rules[verb] === 'undefined') {
      throw new Error(`Unknown verb "${verb}"`)
    }

    return Boolean(rules[verb])
  }

  /**
   * Like can but verb object is an array where only some has to be
   * true for the rule to match.
   *
   * Note the verb objects do not need to be of the same kind.
   *
   * @access public
   */
  async some(
    user: object,
    verb: Verb,
    verbObjects: VerbObject[],
    ...args: any[]
  ) {
    return asyncSome(verbObjects, (s: VerbObject) =>
      this.can(user, verb, s, ...args),
    )
  }

  /**
   * Like can but verbObject is an array where all has to be
   * true for the rule to match.
   *
   * Note the verb objects do not need to be of the same kind.
   *
   * @access public
   */
  async every(
    user: Object,
    verb: Verb,
    verbObjects: VerbObject[],
    ...args: any[]
  ) {
    return asyncEvery(verbObjects, (s: VerbObject) =>
      this.can(user, verb, s, ...args),
    )
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
      verbObject: VerbObject,
      ...args: any[]
    ) {
      return acl.can(this, verb, verbObject, ...args)
    }
    User.prototype.can.every = function (
      verb: Verb,
      verbObjects: VerbObject[],
      ...args: any[]
    ) {
      return acl.every(this, verb, verbObjects, ...args)
    }
    User.prototype.can.some = function (
      verb: Verb,
      verbObjects: VerbObject[],
      ...args: any[]
    ) {
      return acl.some(this, verb, verbObjects, ...args)
    }
    return this
  }

  /**
   * Rules are grouped by verb objects and this default mapper tries to
   * map any non falsy input to a verb object name.
   *
   * This is important when you want to try a verb against a rule
   * passing in an instance of a class.
   *
   * - strings becomes verb objects
   * - function's names are used for verb object
   * - object's constructor name is used for verb object
   *
   * Override this function if your models do not match this approach.
   *
   * E.g. say that you are using plain data objects with a type property
   * to indicate the type of the object.
   *
   * ```javascript
   *   acl.verbObjectMapper = s => typeof s === 'string' ? s : s.type
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
   * classes to verb object name.
   *
   * @access public
   */
  verbObjectMapper(verbObject: VerbObject): VerbObjectName {
    if (typeof verbObject === 'string') {
      return verbObject
    }
    if (this.registry.has(verbObject)) {
      return this.registry.get(verbObject)
    }
    if (this.registry.has(verbObject.constructor)) {
      return this.registry.get(verbObject.constructor)
    }
    if (typeof verbObject === 'function') {
      return verbObject.name
    }
    return verbObject.constructor.name
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
   * Remove rules for verb object
   *
   * Optionally limit to a single verb.
   */
  removeRules(verbObject: VerbObject, verb: Verb | null = null) {
    const verbObjectName = this.verbObjectMapper(verbObject)
    if (this.rules.has(verbObjectName)) {
      if (verb) {
        const rules = this.rules.get(verbObjectName)
        if (rules) {
          delete rules[verb]
        }
        return this
      }
      this.rules.delete(verbObjectName)
    }
    return this
  }

  /**
   * Remove policy for verb object
   */
  removePolicy(verbObject: VerbObject) {
    const verbObjectName = this.verbObjectMapper(verbObject)
    this.policies.delete(verbObjectName)
    return this
  }

  /**
   * Convenience method for removing all rules and policies for a verb object
   */
  removeAll(verbObject: VerbObject) {
    this.removeRules(verbObject)
    this.removePolicy(verbObject)
    return this
  }
}

export default Acl
