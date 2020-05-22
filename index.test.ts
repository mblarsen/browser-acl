import Acl from './index'
import { Policy } from './index'

interface MixinUser {
  can?: Function
}

class User {
  [key: string]: any
}

class Apple {
  [key: string]: any
}
class Job {
  [key: string]: any

  constructor(data?: any) {
    Object.assign(this, data || {})
  }
}

describe('The basics', () => {
  test('Acl mixin', () => {
    const acl = new Acl()
    acl.mixin(User)
    const user: MixinUser = new User()
    expect(user.can).toBeDefined()
  })

  test('Global rules', () => {
    const acl = new Acl()
    acl.rule('purgeInactive', (user: User) => user.isAdmin)
    expect(acl.can({ isAdmin: true } as User, 'purgeInactive')).toBe(true)
    expect(acl.can({ isAdmin: false }, 'purgeInactive')).toBe(false)
    acl.rule('contact', true)
    expect(acl.can({}, 'contact')).toBe(true)
    acl.rule('linger', false)
    expect(acl.can({}, 'linger')).toBe(false)
    acl.rule('pillage', false)
    expect(acl.can({}, 'pillage')).toBe(false)
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
    acl.rule(['eat'], Apple, function (_0, _1, _2, param: string) {
      expect(param).toBe('worm')
      return true
    })
    const user = new User()
    expect(user.can('eat', new Apple(), 'worm')).toBe(true)
  })
})

describe('Multiple', () => {
  test('Can eat some apples', () => {
    const acl = new Acl()
    acl.mixin(User)
    acl.rule('eat', Apple, (_, a) => !Boolean(a.rotten))
    const user = new User()
    const fine = new Apple()
    const rotten = new Apple()
    rotten.rotten = true
    expect(user.can('eat', fine)).toBe(true)
    expect(user.can('eat', rotten)).toBe(false)
    expect(acl.some(user, 'eat', [fine, rotten])).toBe(true)
    expect(acl.some(user, 'eat', [rotten, rotten])).toBe(false)
  })

  test('Can eat some apples and jobs', () => {
    const acl = new Acl()
    acl.rule('eat', Apple)
    acl.rule('eat', Job)
    const user = new User()
    expect(acl.can(user, 'eat', new Apple())).toBe(true)
    expect(acl.can(user, 'eat', new Job())).toBe(true)
    expect(acl.some(user, 'eat', [new Apple(), new Job()])).toBe(true)
  })

  test('Can eat every apple', () => {
    const acl = new Acl()
    acl.mixin(User)
    acl.rule('eat', Apple, (_, a) => !Boolean(a.rotten))
    const user = new User()
    const fine = new Apple()
    const rotten = new Apple()
    rotten.rotten = true
    expect(user.can('eat', fine)).toBe(true)
    expect(user.can('eat', rotten)).toBe(false)
    expect(acl.every(user, 'eat', [fine, rotten])).toBe(false)
    expect(acl.every(user, 'eat', [fine, new Apple()])).toBe(true)
  })

  test('User can eat some apples', () => {
    const acl = new Acl()
    acl.mixin(User)
    acl.rule('eat', Apple, (_, a) => !Boolean(a.rotten))
    const user = new User()
    const fine = new Apple()
    const rotten = new Apple()
    rotten.rotten = true
    expect(user.can.some('eat', [fine, rotten])).toBe(true)
  })

  test('User can eat every apple', () => {
    const acl = new Acl()
    acl.mixin(User)
    acl.rule('eat', Apple, (_, a) => !Boolean(a.rotten))
    const user = new User()
    const fine = new Apple()
    const rotten = new Apple()
    rotten.rotten = true
    expect(user.can.every('eat', [fine, rotten])).toBe(false)
    expect(user.can.every('eat', [fine, new Job()])).toBe(false)
  })
})

describe('Strict mode', () => {
  test('Throws on unknown verb', () => {
    const acl = new Acl({ strict: true })
    acl.mixin(User)
    acl.rule('grow', Apple)
    const user = new User()
    expect(user.can.bind(user, 'eat', new Apple())).toThrow(
      'Unknown verb "eat"',
    )
  })

  test('Throws on unknown verb object', () => {
    const acl = new Acl({ strict: true })
    acl.mixin(User)
    const user = new User()
    expect(user.can.bind(user, 'eat', new Apple())).toThrow(
      'No rules for verb object "Apple"',
    )
  })
})

describe('Registry and mapper', () => {
  test('Can register a class', () => {
    const acl = new Acl({ strict: true })
    class Foo {}
    acl.register(Foo, 'User')
    expect(acl.registry.has(Foo)).toBe(true)
    expect(acl.registry.get(Foo)).toBe('User')
    acl.rule('greet', Foo)
    expect(acl.can({}, 'greet', new Foo())).toBe(true)
  })

  test('Custom mapper', () => {
    const acl = new Acl({ strict: true })
    const item = { type: 'Item' }
    acl.rule('lock', 'Item')
    expect(acl.can.bind(acl, {}, 'lock', item)).toThrow(
      'No rules for verb object "Object"',
    )
    acl.verbObjectMapper = (s: string | { [key: string]: any }) =>
      typeof s === 'string' ? s : s.type
    expect(acl.can({}, 'lock', item)).toBe(true)
  })
})

describe('Reset and remove', () => {
  test('Reset', () => {
    const acl = new Acl()
    function JobPolicy(this: Policy) {
      this.view = true
    }
    const job = new Job()
    const apple = new Apple()
    acl.strict = true
    acl.register(Job, 'Job')
    acl.rule('eat', 'Apple')
    acl.policy(JobPolicy, Job)
    expect(acl.registry.has(Job)).toBe(true)
    expect(acl.can({}, 'view', job)).toBe(true)
    expect(acl.can({}, 'eat', apple)).toBe(true)
    acl.reset()
    expect(acl.registry.has(Job)).toBe(false)
    expect(acl.can.bind(acl, {}, 'view', job)).toThrow(
      'No rules for verb object "Job"',
    )
    expect(acl.can.bind(acl, {}, 'eat', apple)).toThrow(
      'No rules for verb object "Apple"',
    )
  })

  test('Remove rules', () => {
    const acl = new Acl()
    const apple = new Apple()
    acl.strict = true
    acl.rule('eat', 'Apple')
    acl.rule('discard', 'Apple')
    expect(acl.can({}, 'eat', apple)).toBe(true)
    expect(acl.can({}, 'discard', apple)).toBe(true)
    acl.removeRules(apple)
    expect(acl.can.bind(acl, {}, 'eat', apple)).toThrow(
      'No rules for verb object "Apple"',
    )
    expect(acl.can.bind(acl, {}, 'discard', apple)).toThrow(
      'No rules for verb object "Apple"',
    )
  })

  test('Remove rules, single', () => {
    const acl = new Acl()
    const apple = new Apple()
    acl.strict = true
    acl.register(Apple, 'Apple')
    acl.rule('eat', 'Apple')
    acl.rule('discard', 'Apple')
    expect(acl.can({}, 'eat', apple)).toBe(true)
    expect(acl.can({}, 'discard', apple)).toBe(true)
    acl.removeRules(apple, 'discard')
    expect(acl.registry.has(Apple)).toBe(true)
    expect(acl.can({}, 'eat', apple)).toBe(true)
    expect(acl.can.bind(acl, {}, 'discard', apple)).toThrow(
      'Unknown verb "discard"',
    )
  })

  test('Remove policy', () => {
    const acl = new Acl()
    function JobPolicy(this: Policy) {
      this.view = true
    }
    const job = new Job()
    acl.strict = true
    acl.register(Job, 'Job')
    acl.policy(JobPolicy, Job)
    expect(acl.can({}, 'view', job)).toBe(true)
    acl.removePolicy(job)
    expect(acl.registry.has(Job)).toBe(true)
    expect(acl.can.bind(acl, {}, 'view', job)).toThrow(
      'No rules for verb object "Job"',
    )
  })

  test('Remove all', () => {
    const acl = new Acl()
    function JobPolicy(this: Policy) {
      this.view = true
    }
    const job = new Job()
    const apple = new Apple()
    acl.strict = true
    acl.register(Job, 'Job')
    acl.rule('eat', 'Apple')
    acl.policy(JobPolicy, Job)
    expect(acl.registry.has(Job)).toBe(true)
    expect(acl.can({}, 'view', job)).toBe(true)
    expect(acl.can({}, 'eat', apple)).toBe(true)
    acl.removeAll(job)
    acl.removeAll(apple)
    expect(acl.registry.has(Job)).toBe(true)
    expect(acl.can.bind(acl, {}, 'view', job)).toThrow(
      'No rules for verb object "Job"',
    )
    expect(acl.can.bind(acl, {}, 'eat', apple)).toThrow(
      'No rules for verb object "Apple"',
    )
  })
})

describe('More complex cases', () => {
  test('Can create jobs', () => {
    const acl = new Acl()
    acl.mixin(User)
    const owner = new User()
    const coworker = new User()

    const data = {
      company: {
        users: [
          { user: owner, role: 'owner' },
          { user: coworker, role: 'coworker' },
        ],
      },
    }

    const company = {
      users: [
        { user: owner, role: 'owner' },
        { user: coworker, role: 'coworker' },
      ],
    }

    const job = new Job({
      users: [
        { user: owner, role: 'owner' },
        { user: coworker, role: 'coworker' },
      ],
    })

    acl.rule(['create'], Job, (user?: object): boolean => {
      return Boolean(
        company.users.find((rel) => rel.user === user && rel.role === 'owner'),
      )
    })

    acl.rule(['view'], Job, (user, verbObject) => {
      return (
        verbObject.users.find((rel: any) => rel.user === user) ||
        data.company.users.find(
          (rel) => rel.user === user && rel.role === 'owner',
        )
      )
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
          { user: owner, role: 'owner' },
          { user: coworker, role: 'coworker' },
        ],
      },
    }

    const job = new Job({
      users: [
        { user: owner, role: 'owner' },
        { user: coworker, role: 'coworker' },
      ],
    })

    const policy = {
      create: function (user: any) {
        return data.company.users.find(
          (rel) => rel.user === user && rel.role === 'owner',
        )
      },
      view: function (user: any, verbObject: any) {
        return (
          verbObject.users.find((rel: any) => rel.user === user) ||
          data.company.users.find(
            (rel) => rel.user === user && rel.role === 'owner',
          )
        )
      },
    }

    acl.policy(policy, Job)

    expect(owner.can('create', Job)).toBe(true)
    expect(coworker.can('create', Job)).toBe(false)

    expect(owner.can('view', job)).toBe(true)
    expect(coworker.can('view', job)).toBe(true)
  })

  test('Policy newed', () => {
    const acl = new Acl()
    function JobPolicy(this: Policy) {
      this.view = true
    }
    acl.policy(JobPolicy, Job)
    expect(acl.policies.get('Job')).toBeInstanceOf(JobPolicy)
    expect(acl.can({}, 'view', new Job())).toBe(true)
  })

  test('Policy overwrites rules', () => {
    const acl = new Acl()
    function JobPolicy(this: Policy) {
      this.view = true
    }
    const job = new Job()
    acl.rule('edit', 'Job')
    acl.policy(JobPolicy, Job)
    acl.rule('edit', 'Job')
    expect(acl.can({}, 'edit', job)).toBe(false)
    expect(acl.can({}, 'view', job)).toBe(true)
  })

  test('Policy beforeAll', () => {
    const acl = new Acl()
    function JobPolicy(this: Policy) {
      this.beforeAll = function (verb: string, user: any) {
        if (user.isAdmin) {
          return true
        }
        if (verb === 'beLazy') {
          return false
        }
      }
      this.view = true
      this.edit = false
      this.beLazy = true
    }
    const job = new Job()
    acl.policy(JobPolicy, Job)
    expect(acl.can({}, 'view', job)).toBe(true)
    expect(acl.can({ isAdmin: true }, 'view', job)).toBe(true)
    expect(acl.can({}, 'edit', job)).toBe(false)
    expect(acl.can({ isAdmin: true }, 'edit', job)).toBe(true)
    expect(acl.can({}, 'beLazy', job)).toBe(false)
    expect(acl.can({ isAdmin: true }, 'beLazy', job)).toBe(true)
  })
})
