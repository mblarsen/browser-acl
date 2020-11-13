import Acl from '../index'
import { Policy } from '../../types/index.d'

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
  test('Acl mixin', async () => {
    const acl = new Acl()
    acl.mixin(User)
    const user: MixinUser = new User()
    expect(await user.can).toBeDefined()
  })

  test('Global rules', async () => {
    const acl = new Acl()
    acl.rule('purgeInactive', (user: User) => user.isAdmin)
    expect(
      await acl.can({ isAdmin: true } as User, 'purgeInactive'),
    ).toBeTruthy()
    expect(await acl.can({ isAdmin: false }, 'purgeInactive')).toBeFalsy()
    acl.rule('contact', true)
    expect(await acl.can({}, 'contact')).toBeTruthy()
    acl.rule('linger', false)
    expect(await acl.can({}, 'linger')).toBeFalsy()
    acl.rule('pillage', false)
    expect(await acl.can({}, 'pillage')).toBeFalsy()
  })

  test('Cannot eat apples (no rule)', async () => {
    const acl = new Acl()
    acl.mixin(User)
    const user = new User()
    expect(await user.can('eat', 'Apple')).toBeFalsy()
  })

  test('Cannot eat apples (!test)', async () => {
    const acl = new Acl()
    acl.mixin(User)
    acl.rule(['eat'], 'Apple', false)
    const user = new User()
    expect(await user.can('eat', 'Apple')).toBeFalsy()
  })

  test('Can eat apples (string)', async () => {
    const acl = new Acl()
    acl.mixin(User)
    acl.rule(['eat'], 'Apple')
    const user = new User()
    expect(await user.can('eat', 'Apple')).toBeTruthy()
  })

  test('Can eat apples (Class)', async () => {
    const acl = new Acl()
    acl.mixin(User)
    acl.rule(['eat'], Apple)
    const user = new User()
    expect(await user.can('eat', Apple)).toBeTruthy()
  })

  test('Can eat apples (Object)', async () => {
    const acl = new Acl()
    acl.mixin(User)
    acl.rule(['eat'], Apple)
    const user = new User()
    expect(await user.can('eat', new Apple())).toBeTruthy()
  })

  test('Can eat apples (params)', async () => {
    const acl = new Acl()
    acl.mixin(User)
    acl.rule(['eat'], Apple, function (_0, _1, _2, param: string) {
      expect(param).toEqual('worm')
      return true
    })
    const user = new User()
    expect(await user.can('eat', new Apple(), 'worm')).toBeTruthy()
  })
})

describe('Multiple', () => {
  test('Can eat some apples', async () => {
    const acl = new Acl()
    acl.mixin(User)
    acl.rule('eat', Apple, (_, a) => !Boolean(a.rotten))
    const user = new User()
    const fine = new Apple()
    const rotten = new Apple()
    rotten.rotten = true
    expect(await acl.some(user, 'eat', [fine, rotten])).toBeTruthy()
    expect(await acl.some(user, 'eat', [rotten, rotten])).toBe(false)
  })

  test('Can eat some apples and jobs', async () => {
    const acl = new Acl()
    acl.rule('eat', Apple)
    acl.rule('eat', Job)
    const user = new User()
    expect(await acl.some(user, 'eat', [new Apple(), new Job()])).toBeTruthy()
  })

  test('Can eat every apple', async () => {
    const acl = new Acl()
    acl.mixin(User)
    acl.rule('eat', Apple, (_, a) => !Boolean(a.rotten))
    const user = new User()
    const fine = new Apple()
    const rotten = new Apple()
    rotten.rotten = true
    expect(await acl.every(user, 'eat', [fine, fine])).toBe(true)
    expect(await acl.every(user, 'eat', [fine, rotten])).toBe(false)
    expect(await acl.every(user, 'eat', [fine, new Apple()])).toBe(true)
  })

  test('User can eat some apples', async () => {
    const acl = new Acl()
    acl.mixin(User)
    acl.rule('eat', Apple, (_, a) => !Boolean(a.rotten))
    const user = new User()
    const fine = new Apple()
    const rotten = new Apple()
    rotten.rotten = true
    expect(await user.can.some('eat', [fine, rotten])).toBeTruthy()
  })

  test('User can eat every apple', async () => {
    const acl = new Acl()
    acl.mixin(User)
    acl.rule('eat', Apple, (_, a) => !Boolean(a.rotten))
    const user = new User()
    const fine = new Apple()
    const rotten = new Apple()
    rotten.rotten = true
    expect(await user.can.every('eat', [fine, rotten])).toBe(false)
    expect(await user.can.every('eat', [fine, new Job()])).toBe(false)
  })
})

describe('Strict mode', () => {
  test('Throws on unknown verb', async () => {
    const acl = new Acl({ strict: true })
    acl.mixin(User)
    acl.rule('grow', Apple)
    const user = new User()
    expect(user.can.bind(user, 'eat', new Apple())).rejects.toThrow(
      'Unknown verb "eat"',
    )
  })

  test('Throws on unknown verb object', async () => {
    const acl = new Acl({ strict: true })
    acl.mixin(User)
    const user = new User()
    expect(user.can.bind(user, 'eat', new Apple())).rejects.toThrow(
      'No rules for verb object "Apple"',
    )
  })
})

describe('Multiple async', () => {
  test('Can eat some async apples', async () => {
    const acl = new Acl()
    acl.mixin(User)
    acl.rule('eat', Apple, (_, a) => Promise.resolve(!Boolean(a.rotten)))
    const user = new User()
    const fine = new Apple()
    const rotten = new Apple()
    rotten.rotten = true
    expect(await acl.some(user, 'eat', [fine, rotten])).toBeTruthy()
    expect(await acl.some(user, 'eat', [rotten, rotten])).toBe(false)
  })

  test('Can eat some async apples and async jobs', async () => {
    const acl = new Acl()
    acl.rule('eat', Apple)
    acl.rule('eat', Job)
    const user = new User()
    expect(await acl.some(user, 'eat', [new Apple(), new Job()])).toBeTruthy()
  })

  test('Can eat every async apple', async () => {
    const acl = new Acl()
    acl.mixin(User)
    acl.rule('eat', Apple, (_, a) => Promise.resolve(!Boolean(a.rotten)))
    const user = new User()
    const fine = new Apple()
    const rotten = new Apple()
    rotten.rotten = true
    expect(await acl.every(user, 'eat', [fine, fine])).toBe(true)
    expect(await acl.every(user, 'eat', [fine, rotten])).toBe(false)
    expect(await acl.every(user, 'eat', [fine, new Apple()])).toBe(true)
  })

  test('User can eat some async apples', async () => {
    const acl = new Acl()
    acl.mixin(User)
    acl.rule('eat', Apple, (_, a) => Promise.resolve(!Boolean(a.rotten)))
    const user = new User()
    const fine = new Apple()
    const rotten = new Apple()
    rotten.rotten = true
    expect(await user.can.some('eat', [fine, rotten])).toBeTruthy()
  })

  test('User can eat every async apple', async () => {
    const acl = new Acl()
    acl.mixin(User)
    acl.rule('eat', Apple, (_, a) => Promise.resolve(!Boolean(a.rotten)))
    const user = new User()
    const fine = new Apple()
    const rotten = new Apple()
    rotten.rotten = true
    expect(await user.can.every('eat', [fine, rotten])).toBe(false)
    expect(await user.can.every('eat', [fine, new Job()])).toBe(false)
  })
})

describe('Registry and mapper', () => {
  test('Can register a class', async () => {
    const acl = new Acl({ strict: true })
    class Foo {}
    acl.register(Foo, 'User')
    expect(acl.registry.has(Foo)).toBe(true)
    expect(acl.registry.get(Foo)).toBe('User')
    acl.rule('greet', Foo)
    expect(await acl.can({}, 'greet', new Foo())).toBeTruthy()
  })

  test('Custom mapper', async () => {
    const acl = new Acl({ strict: true })
    const item = { type: 'Item' }
    acl.rule('lock', 'Item')
    expect(acl.can.bind(acl, {}, 'lock', item)).rejects.toThrow(
      'No rules for verb object "Object"',
    )
    acl.verbObjectMapper = (s: string | { [key: string]: any }) =>
      typeof s === 'string' ? s : s.type
    expect(await acl.can({}, 'lock', item)).toBeTruthy()
  })
})

describe('Reset and remove', () => {
  test('Reset', async () => {
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
    expect(await acl.can({}, 'view', job)).toBeTruthy()
    expect(await acl.can({}, 'eat', apple)).toBeTruthy()
    acl.reset()
    expect(acl.registry.has(Job)).toBe(false)
    expect(acl.can.bind(acl, {}, 'view', job)).rejects.toThrow(
      'No rules for verb object "Job"',
    )
    expect(acl.can.bind(acl, {}, 'eat', apple)).rejects.toThrow(
      'No rules for verb object "Apple"',
    )
  })

  test('Remove rules', async () => {
    const acl = new Acl()
    const apple = new Apple()
    acl.strict = true
    acl.rule('eat', 'Apple')
    acl.rule('discard', 'Apple')
    expect(await acl.can({}, 'eat', apple)).toBeTruthy()
    expect(await acl.can({}, 'discard', apple)).toBeTruthy()
    acl.removeRules(apple)
    expect(acl.can.bind(acl, {}, 'eat', apple)).rejects.toThrow(
      'No rules for verb object "Apple"',
    )
    expect(acl.can.bind(acl, {}, 'discard', apple)).rejects.toThrow(
      'No rules for verb object "Apple"',
    )
  })

  test('Remove rules, single', async () => {
    const acl = new Acl()
    const apple = new Apple()
    acl.strict = true
    acl.register(Apple, 'Apple')
    acl.rule('eat', 'Apple')
    acl.rule('discard', 'Apple')
    expect(await acl.can({}, 'eat', apple)).toBeTruthy()
    expect(await acl.can({}, 'discard', apple)).toBeTruthy()
    acl.removeRules(apple, 'discard')
    expect(acl.registry.has(Apple)).toBe(true)
    expect(await acl.can({}, 'eat', apple)).toBeTruthy()
    expect(acl.can.bind(acl, {}, 'discard', apple)).rejects.toThrow(
      'Unknown verb "discard"',
    )
  })

  test('Remove policy', async () => {
    const acl = new Acl()
    function JobPolicy(this: Policy) {
      this.view = true
    }
    const job = new Job()
    acl.strict = true
    acl.register(Job, 'Job')
    acl.policy(JobPolicy, Job)
    expect(await acl.can({}, 'view', job)).toBeTruthy()
    acl.removePolicy(job)
    expect(acl.registry.has(Job)).toBe(true)
    expect(await acl.can.bind(acl, {}, 'view', job)).rejects.toThrow(
      'No rules for verb object "Job"',
    )
  })

  test('Remove all', async () => {
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
    expect(await acl.can({}, 'view', job)).toBeTruthy()
    expect(await acl.can({}, 'eat', apple)).toBeTruthy()
    acl.removeAll(job)
    acl.removeAll(apple)
    expect(acl.registry.has(Job)).toBe(true)
    expect(await acl.can.bind(acl, {}, 'view', job)).rejects.toThrow(
      'No rules for verb object "Job"',
    )
    expect(await acl.can.bind(acl, {}, 'eat', apple)).rejects.toThrow(
      'No rules for verb object "Apple"',
    )
  })
})

describe('More complex cases', () => {
  test('Can create jobs', async () => {
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

    expect(await owner.can('create', Job)).toBeTruthy()
    expect(await coworker.can('create', Job)).toBeFalsy()

    expect(await owner.can('view', job)).toBeTruthy()
    expect(await coworker.can('view', job)).toBeTruthy()
  })

  test('Policy', async () => {
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

    expect(await owner.can('create', Job)).toBeTruthy()
    expect(await coworker.can('create', Job)).toBeFalsy()

    expect(await owner.can('view', job)).toBeTruthy()
    expect(await coworker.can('view', job)).toBeTruthy()
  })

  test('Policy newed', async () => {
    const acl = new Acl()
    function JobPolicy(this: Policy) {
      this.view = true
    }
    acl.policy(JobPolicy, Job)
    expect(acl.policies.get('Job')).toBeInstanceOf(JobPolicy)
    expect(await acl.can({}, 'view', new Job())).toBeTruthy()
  })

  test('Policy overwrites rules', async () => {
    const acl = new Acl()
    function JobPolicy(this: Policy) {
      this.view = true
    }
    const job = new Job()
    acl.rule('edit', 'Job')
    acl.policy(JobPolicy, Job)
    acl.rule('edit', 'Job')
    expect(await acl.can({}, 'edit', job)).toBeFalsy()
    expect(await acl.can({}, 'view', job)).toBeTruthy()
  })

  test('Policy beforeAll', async () => {
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
    expect(await acl.can({}, 'view', job)).toBeTruthy()
    expect(await acl.can({ isAdmin: true }, 'view', job)).toBeTruthy()
    expect(await acl.can({}, 'edit', job)).toBeFalsy()
    expect(await acl.can({ isAdmin: true }, 'edit', job)).toBeTruthy()
    expect(await acl.can({}, 'beLazy', job)).toBeFalsy()
    expect(await acl.can({ isAdmin: true }, 'beLazy', job)).toBeTruthy()
  })
})
