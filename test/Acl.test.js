import Acl from '../'

class User {}
class Apple {}
class Job {}

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
  expect(user.can('eat', 'Apple')).toBe(true)
  expect(user.can('eat', Apple)).toBe(true)
  expect(user.can('eat', new Apple())).toBe(true)
})

test('Scribe-Assist', () => {
  const acl = new Acl()
  const owner = new User()
  const coworker = new User()
  const ScribeAssist = {
    active_organization: {
      users: [{user: owner, role: 'owner'}, {user: coworker, role: 'coworker'}]
    }
  }
  acl.mixin(User)
  acl.rule(['create'], Job, (user, subject) => {
    return ScribeAssist.active_organization.users.find(rel => rel.user === user && rel.role === 'owner')
  })
  expect(owner.can('create', Job)).toBe(true)
  expect(coworker.can('create', Job)).toBe(false)
})
