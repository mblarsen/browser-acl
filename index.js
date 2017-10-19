// TODO consider Guad instead
class Acl {
  constructor() {
    this.rules = new Map()
    this.policies = new Map()
    this.subjectMapper = subject => {
      if (typeof subject === 'string') { return subject }
      return typeof subject === 'function'
        ? subject.name
        : subject.constructor.name
    }
  }

  /**
   * mixin
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
   * rule
   *
   * @access public
   * @param {Array<string>|string} verbs
   * @param {Function|Object|string} subject
   * @param {Boolean} test=true
   */
  rule(verbs, subject, test = true) {
    const verbs_ = Array.isArray(verbs) ? verbs : [verbs]
    const subject_ = this.subjectMapper(subject)
    verbs_.forEach(verb => {
      const rules = this.rules.get(subject_) || {}
      rules[verb] = test
      this.rules.set(subject_, rules)
    })
    return this
  }

  policy(policy, subject) {
    const subject_ = this.subjectMapper(subject)
    this.policies.set(subject_, policy)
  }

  /**
   * can
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
    return Boolean(rules[verb])
  }
}

export default Acl
