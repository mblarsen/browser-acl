const { default: Acl } = require('browser-acl')
const acl = new Acl()

class User {
  constructor({ id, name, role = 'user' }) {
    this.id = id
    this.name = name
    this.role = role
  }
  isModerator() {
    return this.role === 'moderator' || this.role === 'admin'
  }
  isAdmin() {
    return this.role === 'admin'
  }
}

class Post {
  constructor({ userId, title }) {
    this.title = title
    this.userId = userId
  }
}

class Comment {
  constructor({ userId, body }) {
    this.body = body
    this.userId = userId
  }
}

class CommentPolicy {
  beforeAll(_, user) {
    if (user.isAdmin()) {
      return true
    }
  }
  edit(user, comment) {
    return comment.userId === user.id
  }
  moderate(user, _) {
    return user.isModerator()
  }
}

acl.rule('view', Post)
acl.rule('moderate', Post, user => user.isModerator())
acl.rule(['edit', 'delete'], Post, (user, post) => post.userId === user.id)
acl.rule('purgeInactive', user => user.isAdmin())
acl.policy(CommentPolicy, Comment)

const admin = new User({ id: 1, name: 'Admin', role: 'admin' })
const moderator = new User({ id: 2, name: 'Moderator', role: 'moderator' })
const user1 = new User({ id: 3, name: 'User 1', role: 'user' })
const user2 = new User({ id: 4, name: 'User 2', role: 'user' })
const post1 = new Post({ userId: 3, title: 'Post 1' })
const comment1 = new Comment({ userId: 3, body: 'Hmmm...' })

console.log('User 1 can edit post 1?', acl.can(user1, 'edit', post1))
console.log('User 2 can edit post 1?', acl.can(user2, 'edit', post1))
console.log('Moderator can edit post 1?', acl.can(moderator, 'edit', post1))
console.log(
  'Moderator can moderate post 1?',
  acl.can(moderator, 'moderate', post1),
)

console.log('Admin can edit comment 1?', acl.can(admin, 'edit', comment1))
console.log('User 2 can edit comment 1?', acl.can(user2, 'edit', comment1))
