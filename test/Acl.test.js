import Acl from '../index.js'

class User {}
class Apple {}
class Job {
  constructor(data) {
    Object.assign(this, data || {})
  }
}

describe('The basics', () => {
  test('Acl mixin', () => {
    const acl = new Acl()
    acl.mixin(User)
    const user = new User()
    expect(user.can).toBeDefined()
  })

  test('Cannot eat apples (no rule)', () => {
    const acl = new Acl()
    acl.mixin(User)
    const user = new User()
    expect(user.can('eat', 'Apple')).toBe(false)
  })

  test('Cannot eat apples (!test)', () => {
    const acl = new Acl()
    acl.mixin(User)
    acl.rule(['eat'], 'Apple', false)
    const user = new User()
    expect(user.can('eat', 'Apple')).toBe(false)
  })

  test('Can eat apples (string)', () => {
    const acl = new Acl()
    acl.mixin(User)
    acl.rule(['eat'], 'Apple')
    const user = new User()
    expect(user.can('eat', 'Apple')).toBe(true)
  })

  test('Can eat apples (Class)', () => {
    const acl = new Acl()
    acl.mixin(User)
    acl.rule(['eat'], Apple)
    const user = new User()
    expect(user.can('eat', Apple)).toBe(true)
  })

  test('Can eat apples (Object)', () => {
    const acl = new Acl()
    acl.mixin(User)
    acl.rule(['eat'], Apple)
    const user = new User()
    expect(user.can('eat', new Apple())).toBe(true)
  })

  test('Can eat apples (params)', () => {
    const acl = new Acl()
    acl.mixin(User)
    acl.rule(['eat'], Apple, function (user, apple, _, param) {
      expect(param).toBe('worm')
      return true
    })
    const user = new User()
    expect(user.can('eat', new Apple(), 'worm')).toBe(true)
  })
})

describe('Strict mode', () => {
  test('Throws on unknown verb', () => {
    const acl = new Acl({strict: true})
    acl.mixin(User)
    acl.rule('grow', Apple)
    const user = new User()
    expect(user.can.bind(user, 'eat', new Apple())).toThrow('Unknown verb "eat"')
  })

  test('Throws on unknown subject', () => {
    const acl = new Acl({strict: true})
    acl.mixin(User)
    const user = new User()
    expect(user.can.bind(user, 'eat', new Apple())).toThrow('Unknown subject "Apple"')
  })
})

describe('More complex cases', () => {
  test('Can create jobs', () => {
    const acl = new Acl()
    acl.mixin(User)
    const owner = new User()
    const coworker = new User()

    const company = {
      users: [
        {user: owner, role: 'owner'},
        {user: coworker, role: 'coworker'}
      ]
    }

    const job = new Job({
      users: [
        {user: owner, role: 'owner'},
        {user: coworker, role: 'coworker'}
      ]
    })

    acl.rule(['create'], Job, (user) => {
      return company.users.find(rel => rel.user === user && rel.role === 'owner')
    })

    acl.rule(['view'], Job, (user, subject) => {
      return subject.users.find(rel => rel.user === user) ||
        data.company.users.find(rel => rel.user === user && rel.role === 'owner')
    })

    expect(owner.can('create', Job)).toBe(true)
    expect(coworker.can('create', Job)).toBe(false)

    expect(owner.can('view', job)).toBe(true)
    expect(coworker.can('view', job)).toBe(true)
  })
  test('Policy', () => {
    const acl = new Acl()
    acl.mixin(User)
    const owner = new User()
    const coworker = new User()

    const data = {
      company: {
        users: [
          {user: owner, role: 'owner'},
          {user: coworker, role: 'coworker'}
        ]
      }
    }

    const job = new Job({
      users: [
        {user: owner, role: 'owner'},
        {user: coworker, role: 'coworker'}
      ]
    })

    const policy = {
      create: function (user, subject) {
        return data.company.users.find(rel => rel.user === user && rel.role === 'owner')
      },
      view: function (user, subject) {
        return subject.users.find(rel => rel.user === user) ||
          data.company.users.find(rel => rel.user === user && rel.role === 'owner')
      },
    }

    acl.policy(policy, Job)

    expect(owner.can('create', Job)).toBe(true)
    expect(coworker.can('create', Job)).toBe(false)

    expect(owner.can('view', job)).toBe(true)
    expect(coworker.can('view', job)).toBe(true)
  })
})
