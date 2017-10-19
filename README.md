# browser-acl 

[![build status](http://img.shields.io/travis/mblarsen/browser-acl.svg)](http://travis-ci.org/mblarsen/browser-acl) 
[![Known Vulnerabilities](https://snyk.io/test/github/mblarsen/browser-acl/badge.svg)](https://snyk.io/test/github/mblarsen/browser-acl) 
[![NPM version](http://img.shields.io/npm/v/browser-acl.svg)](https://www.npmjs.com/package/browser-acl/) [![](https://img.shields.io/npm/dm/browser-acl.svg)](https://www.npmjs.com/package/browser-acl/)

> Simple ACL library for the browser inspired by Laravel's guards and policies.

# Install

```
yarn add browser-acl
```

# Usage

```javascript
import Acl from 'browser-acl'

const acl = new Acl()

// Attach acl function to user class/constructor
// Adds: user.can() function
acl.attach(User)

acl.rule('view', Post)
acl.rule(['edit', 'delete'], Post, (user, post) => post.id === user.id)

if (user.can('edit', post)) {
  // only users with permission
}
```

