class Acl {

  /**
   * constructor
   *
   * @access public
   * @param {Boolean} {strict=false}={} Errors out on unknown verbs when true
   * @returns {Acl}
   */
  constructor({strict = false} = {}) {
    this.strict = strict
    this.rules = new Map()
    this.policies = new Map()
  }

  /**
   * Mix in augments your user class with a `can` function. This
   * is optional and you can always cann `can` directly on your
   * Acl instance.
   *
   * @access public
   * @param {Object} userClass A user class or contructor function
   */
  mixin(userClass) {
    const acl = this
    userClass.prototype.can = function () {
      return acl.can(this, ...arguments)
    }
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
   *   acl.subjectMapper = subject => subject.type
   *
   * `can` will now use this function when you pass in your objects.
   *
   * @access public
   * @param {Function|Object|string} subject
   * @returns {string} A subject
   */
  subjectMapper(subject) {
    if (typeof subject === 'string') { return subject }
    return typeof subject === 'function'
      ? subject.name
      : subject.constructor.name
  }

  /**
   * You add rules by providing a verb, a subject and an optional
   * test (that otherwise defaults to true).
   *
   * If the test is a function it will be evaluated with the params:
   * user, subject, and subjectName. The test value is ultimately evaluated
   * for thruthiness.
   *
   * @access public
   * @param {Array<string>|string} verbs
   * @param {Function|Object|string} subject
   * @param {Boolean} test=true
   * @returns {Acl}
   */
  rule(verbs, subject, test = true) {
    const subjectName = this.subjectMapper(subject)
    const verbs_ = Array.isArray(verbs) ? verbs : [verbs]
    verbs_.forEach(verb => {
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
   * class Post {
   *   constructor() {
   *     this.view = true       // no need for a functon
   *
   *     this.delete = false    // not really necessary since an abscent
   *                            // verb has the same result
   *   },
   *   edit(user, subject) {
   *     return subject.id === user.id
   *   }
   * }
   *
   * Policies are useful for grouping rules and adding more comples logic.
   *
   * @access public
   * @param {Object} policy A policy with properties that are verbs
   * @param {Function|Object|string} subject
   * @returns {Acl}
   */
  policy(policy, subject) {
    const policy_ = typeof policy === 'function' ? new policy() : policy
    const subject_ = this.subjectMapper(subject)
    this.policies.set(subject_, policy)
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
   *   acl->can(user, 'create', Post)
   *   acl->can(user, 'edit', post)
   *
   * Note that these are also available on the user if you've used
   * the mixin:
   *
   *   user->can('create', Post)
   *   user->can('edit', post)
   *
   * @access public
   * @param {Object} user
   * @param {string} verb
   * @param {Function|Object|string} subject
   * @return Boolean
   */
  can(user, verb, subject) {
    const subject_ = this.subjectMapper(subject)
    const rules = this.policies.get(subject_) || this.rules.get(subject_) || {}
    if (typeof rules[verb] === 'function') {
      return Boolean(rules[verb](user, subject, subject_))
    }

    if (this.strict && typeof rules[verb] === 'undefined') {
      throw new Error(`Unknown verb "${verb}"`)
    }

    return Boolean(rules[verb])
  }
}

export default Acl
