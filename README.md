# browser-acl 🔒

[![build status](http://img.shields.io/travis/mblarsen/browser-acl.svg)](http://travis-ci.org/mblarsen/browser-acl)
[![codebeat badge](https://codebeat.co/badges/c3b557c1-c111-4dbb-bd0a-9c6a30a3b247)](https://codebeat.co/projects/github-com-mblarsen-browser-acl-master)
[![Known Vulnerabilities](https://snyk.io/test/github/mblarsen/browser-acl/badge.svg)](https://snyk.io/test/github/mblarsen/browser-acl)
[![Monthly downloads](https://img.shields.io/npm/dm/browser-acl.svg)](https://www.npmjs.com/package/browser-acl)
[![NPM version](http://img.shields.io/npm/v/browser-acl.svg)](https://www.npmjs.com/package/browser-acl)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/mblarsen/browser-acl/blob/master/LICENSE)

> Simple access control (ACL) library for the browser inspired by Laravel's guards and policies.

Go to [vue-browser-acl](https://github.com/mblarsen/vue-browser-acl) for the official Vue package.

## Install

```
npm i browser-acl
```

## Setup

```javascript
import Acl from 'browser-acl'
const acl = new Acl()

acl.rule('view', Post)
acl.rule('moderate', Post, (user) => user.isModerator())
acl.rule(['edit', 'delete'], Post, (user, post) => post.userId === user.id)
acl.rule('purgeInactive', user => user.isAdmin)
```

[![Try browser-acl on RunKit](https://badge.runkitcdn.com/browser-acl.svg)](https://npm.runkit.com/browser-acl)

Policies (rules through objects or classes) are also supported:

```javascript
// using an object
acl.policy({
  view: true,
  edit: (user, post) => post.userId === user.id),
}, Post)

// using a class
acl.policy(OrganizationPolicy, Organization)
```

Note: policies takes precedence over rules.

## Usage

```javascript
// true if user owns post
acl.can(user, 'edit', post)

// true if user owns at least posts
acl.some(user, 'edit', posts)

// true if user owns all posts
acl.every(user, 'edit', posts)
```

You can add mixins to your user class:

```javascript
acl.mixin(User) // class not instance

user.can('edit', post)
user.can.some('edit', posts)
user.can.every('edit', posts)
```

### Subject mapping

> The process of mapping a subject to rules

A **subject** is an item, an object, an instance of a class.

The default subject mapper makes use of ["poor-man's reflection"](https://github.com/mblarsen/browser-acl/blob/f52cc8e704681cb33d4867e7a217e990444baa6a/index.js#L248-L298), that uses the
name of the subject's constructor to group the rules.

```javascript
class Post {}
const post = new Post()
post.constructor.name // The subject is: Post
```

**Warning: When using webpack or similar this method can break if you are not careful.** 

Since code minifiers will rename functions you have to make sure you only rely
on the function to set up your rules and asking for permission.

```diff
acl.rule('edit', 'Post', ...)
acl.can(user, 'edit', 'Post')  👍 works as expected
acl.can(user, 'edit', Post)    👎 'Post' isn't the name as you'd expect
acl.can(user, 'edit', post)    👎 same story here
```

If your build process minifies your code (specifically mangling of function and class
names), this will break in line 3 since the constructor of post will likely not be `Post`
but rather a single letter or a name prefixed with `__WEBPACK_IMPORTED_MODULE`.

```diff
- acl.rule('edit', 'Post', ...)
+ acl.rule('edit', Post, ...)
  acl.can(user, 'edit', 'Post')  👍 works as expected
  acl.can(user, 'edit', Post)    👍 and so does this
  acl.can(user, 'edit', post)    👍 this too, but see below
```

Passing the class or function, `Post` and whatever that name is after
minification, is used to register the rules. As long as the same import is used
throughout your code base it will work and you don't need to explicitly
register a model.

#### Best practice

```diff
+ acl.register(Post, 'Post')
  acl.can(user, 'edit', 'Post')  👍 works as expected
  acl.can(user, 'edit', Post)    👍 and so does this
  acl.can(user, 'edit', post)    👍 this too
```

If you are using *plain objects* you may want to override the `subjectMapper` with
a custom implementation.

```javascript
acl.subjectMapper = subject => typeof subject === 'string'
  ? subject
  : subject.type

const post = { type: 'post', id: 1, title: 'My first post' }
acl.can(user, 'edit', post) 👍
```

See more [subjectMapper](#subjectmapper)

## Additional Parameters and Global Rules

You can define global rules by omitting the subject when defining rules.

```javascript
acl.rule('purgeInactive', user => user.admin)
acl.can(user, 'purgeInactive')
```

Also you can pass additional parameters to the handler like this:

```javascript
acl.rule('edit', Post, (user, post, verb, additionalParameter) => true)
acl.can(user, 'edit', post, additionalParameter)
```

However, you cannot combine the two without explicitly stating that you are
defining a global rule. You do this by importing the special `GlobalRule`
subject.

```javascript
import {GlobalRule} from 'browser-acl'
acl.rule('purgeInactive', GlobalRule, user => user.admin)
acl.can(user, 'purgeInactive', GlobalRule, additionalParameter)
```

Note: When defining the rule you can omit it, but is is required for `can`.
This is only in the case when you need to pass additional parameters.

# API

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

### Table of Contents

-   [Acl][1]
    -   [rule][2]
    -   [policy][3]
    -   [register][4]
    -   [can][5]
    -   [some][6]
    -   [every][7]
    -   [mixin][8]
    -   [subjectMapper][9]
    -   [reset][10]
    -   [removeRules][11]
    -   [removePolicy][12]
    -   [removeAll][13]

## Acl

Simple ACL library for the browser inspired by Laravel's guards and policies.

**Parameters**

-   `$0` **[Object][14]**  (optional, default `{}`)
    -   `$0.strict`   (optional, default `false`)
-   `options` **[Object][14]**
-   `null` **[Boolean][15]** {strict=false}={} Errors out on unknown verbs when true

### rule

You add rules by providing a verb, a subject and an optional
test (that otherwise defaults to true).

If the test is a function it will be evaluated with the params:
user, subject, and subjectName. The test value is ultimately evaluated
for truthiness.

Examples:

```javascript
acl.rule('create', Post)
acl.rule('edit', Post, (user, post) => post.userId === user.id)
acl.rule('edit', Post, (user, post, verb, additionalParameter, secondAdditionalParameter) => true)
acl.rule('delete', Post, false) // deleting disabled
acl.rule('purgeInactive', user => user.isAdmin) // global rule
```

**Parameters**

-   `verbs` **([Array][16]&lt;[string][17]> | [string][17])**
-   `subject` **([Function][18] \| [Object][14] \| [string][17])** ?
-   `test` **([Boolean][15] \| [Function][18])** =true (optional, default `true`)

Returns **[Acl][19]**

### policy

You can group related rules into policies for a subject. The policies
properties are verbs and they can plain values or functions.

If the policy is a function it will be new'ed up before use.

```javascript
  class Post {
    constructor() {
      this.view = true       // no need for a functon
      this.delete = false    // not really necessary since an abscent
                             // verb has the same result
    }
    beforeAll(verb, user, ...theRest) {
      if (user.isAdmin) {
        return true
      }
      // return nothing (undefined) to pass it on to the other rules
    }
    edit(user, post, verb, additionalParameter, secondAdditionalParameter) {
      return post.id === user.id
    }
  }
```

Policies are useful for grouping rules and adding more complex logic.

**Parameters**

-   `policy` **[Object][14]** A policy with properties that are verbs
-   `subject` **([Function][18] \| [Object][14] \| [string][17])**

Returns **[Acl][19]**

### register

Explicitly map a class or constructor function to a name.

You would want to do this in case your code is heavily
minified in which case the default mapper cannot use the
simple "reflection" to resolve the subject name.

Note: If you override the subjectMapper this is not used,
bud it can be used manually through `this.registry`.

**Parameters**

-   `klass` **[Function][18]** A class or constructor function
-   `subjectName` **[string][17]**

### can

Performs a test if a user can perform action on subject.

The action is a verb and the subject can be anything the
subjectMapper can map to a subject name.

E.g. if you can to test if a user can delete a post you would
pass the actual post. Where as if you are testing us a user
can create a post you would pass the class function or a
string.

```javascript
  acl.can(user, 'create', Post)
  acl.can(user, 'edit', post)
  acl.can(user, 'edit', post, additionalParameter, secondAdditionalParameter)
```

Note that these are also available on the user if you've used
the mixin:

```javascript
  user.can('create', Post)
  user.can('edit', post)
```

**Parameters**

-   `user` **[Object][14]**
-   `verb` **[string][17]**
-   `subject` **([Function][18] \| [Object][14] \| [string][17])**
-   `args` **...any** Any other param is passed into rule

Returns **any** Boolean

### some

Like can but subject is an array where only some has to be
true for the rule to match.

Note the subjects do not need to be of the same kind.

**Parameters**

-   `user` **[Object][14]**
-   `verb`
-   `subjects` **[Array][16]&lt;([Function][18] \| [Object][14] \| [string][17])>**
-   `args` **...any** Any other param is passed into rule

Returns **any** Boolean

### every

Like can but subject is an array where all has to be
true for the rule to match.

Note the subjects do not need to be of the same kind.

**Parameters**

-   `user` **[Object][14]**
-   `verb`
-   `subjects` **[Array][16]&lt;([Function][18] \| [Object][14] \| [string][17])>**
-   `args` **...any** Any other param is passed into rule

Returns **any** Boolean

### mixin

Mix in augments your user class with a `can` function object. This
is optional and you can always call `can` directly on your
Acl instance.

    user.can()
    user.can.some()
    user.can.every()

**Parameters**

-   `User` **[Function][18]** A user class or contructor function

### subjectMapper

Rules are grouped by subjects and this default mapper tries to
map any non falsy input to a subject name.

This is important when you want to try a verb against a rule
passing in an instance of a class.

-   strings becomes subjects
-   function's names are used for subject
-   object's constructor name is used for subject

Override this function if your models do not match this approach.

E.g. say that you are using plain data objects with a type property
to indicate the type of the object.

```javascript
  acl.subjectMapper = s => typeof s === 'string' ? s : s.type
```

`can` will now use this function when you pass in your objects.

```javascript
acl.rule('edit', 'book', (user, book) => user.id === book.authorId)
const thing = {title: 'The Silmarillion', authorId: 1, type: 'book'}
acl.can(user, 'edit', thing)
```

In the example above the 'thing' will follow the rules for 'book'. The
user can edit the book if they are the author.

See [register()][4] for how to manually map
classes to subject name.

**Parameters**

-   `subject` **([Function][18] \| [Object][14] \| [string][17])**

Returns **[string][17]** A subject

### reset

Removes all rules, policies, and registrations

Returns **[Acl][19]**

### removeRules

Remove rules for subject

Optionally limit to a single verb.

**Parameters**

-   `subject` **([Object][14] \| [Function][18] \| [String][17])**
-   `verb` **[String][17]?** an optional verb (optional, default `null`)

Returns **[Acl][19]**

### removePolicy

Remove policy for subject

**Parameters**

-   `subject` **([Object][14] \| [Function][18] \| [String][17])**

Returns **[Acl][19]**

### removeAll

Convenience method for removing all rules and policies for a subject

**Parameters**

-   `subject` **([Object][14] \| [Function][18] \| [String][17])**

Returns **[Acl][19]**

[1]: #acl

[2]: #rule

[3]: #policy

[4]: #register

[5]: #can

[6]: #some

[7]: #every

[8]: #mixin

[9]: #subjectmapper

[10]: #reset

[11]: #removerules

[12]: #removepolicy

[13]: #removeall

[14]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object

[15]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean

[16]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array

[17]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String

[18]: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/function

[19]: #acl
