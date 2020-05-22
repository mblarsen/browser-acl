## next

# 0.9.1

- internal changes

# 0.9.0

- breaking: The concept of `Subject` has been renamed `VerbObject`, because that is
  actually what it is. The subject is always the user. if you are using the
  TypeScript types `Subject*` you need to use `VerbObject` instead
- build: move types into index.ts to avoid special handling afterwards

## 0.8.0

- refactor: rewrite in TypeScript
- breaking: GlobalRule is available through Acl.GlobalRule. Before it was
  exported separately. This only affects you if you explicitly use `GlobalRule`.
  If you've been using non-strict mode (default) you'll have had no need for that.

## [0.7.5](https://github.com/mblarsen/browser-acl/compare/v0.7.4...v0.7.5) (2019-11-01)

## [0.7.4](https://github.com/mblarsen/browser-acl/compare/v0.7.3...v0.7.4) (2019-10-30)

## [0.7.3](https://github.com/mblarsen/browser-acl/compare/v0.7.2...v0.7.3) (2019-08-13)

## [0.7.2](https://github.com/mblarsen/browser-acl/compare/v0.7.1...v0.7.2) (2019-08-12)

### Bug Fixes

- Change test values to avoid false result ([1162b86](https://github.com/mblarsen/browser-acl/commit/1162b86))

## [0.7.1](https://github.com/mblarsen/browser-acl/compare/v0.7.0...v0.7.1) (2018-08-17)

### Features

- Add beforeAll feature to policies ([1c29d90](https://github.com/mblarsen/browser-acl/commit/1c29d90))

# [0.7.0](https://github.com/mblarsen/browser-acl/compare/v0.5.0...v0.7.0) (2018-05-04)

### Bug Fixes

- Deal with absence truth-test function ([5dda25f](https://github.com/mblarsen/browser-acl/commit/5dda25f)), closes [mblarsen/vue-browser-acl#8](https://github.com/mblarsen/vue-browser-acl/issues/8)

# [0.5.0](https://github.com/mblarsen/browser-acl/compare/v0.4.0...v0.5.0) (2018-03-31)

### Bug Fixes

- **docs:** Fix jsdoc for rule function, third param can be function ([034e406](https://github.com/mblarsen/browser-acl/commit/034e406))

### Features

- Add global rules ([442ad55](https://github.com/mblarsen/browser-acl/commit/442ad55)), closes [#1](https://github.com/mblarsen/browser-acl/issues/1)

# [0.4.0](https://github.com/mblarsen/browser-acl/compare/v0.3.7...v0.4.0) (2018-03-17)

### Features

- Add reset, removeRules, removePolicy, and removeAll ([d93752e](https://github.com/mblarsen/browser-acl/commit/d93752e))

## [0.3.7](https://github.com/mblarsen/browser-acl/compare/v0.3.6...v0.3.7) (2018-02-18)

## [0.3.6](https://github.com/mblarsen/browser-acl/compare/v0.3.5...v0.3.6) (2017-11-06)

## [0.3.5](https://github.com/mblarsen/browser-acl/compare/v0.3.4...v0.3.5) (2017-10-22)

## [0.3.4](https://github.com/mblarsen/browser-acl/compare/v0.3.3...v0.3.4) (2017-10-21)

### Bug Fixes

- Default subjectMapper handles classes and instances ([8b74243](https://github.com/mblarsen/browser-acl/commit/8b74243))

## [0.3.3](https://github.com/mblarsen/browser-acl/compare/v0.3.2...v0.3.3) (2017-10-20)

### Bug Fixes

- **test:** Corrects test name ([0714b07](https://github.com/mblarsen/browser-acl/commit/0714b07))
- Newed up police is used instead of the constructor function ([ed990b4](https://github.com/mblarsen/browser-acl/commit/ed990b4))

### Features

- Adds register function ([5e97be1](https://github.com/mblarsen/browser-acl/commit/5e97be1))

## [0.3.2](https://github.com/mblarsen/browser-acl/compare/v0.3.1...v0.3.2) (2017-10-20)

### Features

- Adds some and every functions ([fe41e6b](https://github.com/mblarsen/browser-acl/commit/fe41e6b))

## [0.3.1](https://github.com/mblarsen/browser-acl/compare/v0.3.0...v0.3.1) (2017-10-20)

### Features

- `can` check can take additional params passed to rule eval ([981b3f2](https://github.com/mblarsen/browser-acl/commit/981b3f2))

# [0.3.0](https://github.com/mblarsen/browser-acl/compare/v0.2.0...v0.3.0) (2017-10-20)

# [0.2.0](https://github.com/mblarsen/browser-acl/compare/v0.1.5...v0.2.0) (2017-10-20)

## [0.1.5](https://github.com/mblarsen/browser-acl/compare/v0.1.4...v0.1.5) (2017-10-20)

### Bug Fixes

- Fixes build ([dd31329](https://github.com/mblarsen/browser-acl/commit/dd31329))

### Features

- Added strict mode ([a234938](https://github.com/mblarsen/browser-acl/commit/a234938))

## [0.1.4](https://github.com/mblarsen/browser-acl/compare/v0.1.3...v0.1.4) (2017-10-19)

### Bug Fixes

- **test:** Includes index.js explicitly otherwise package.json is used ([527ff15](https://github.com/mblarsen/browser-acl/commit/527ff15))

## [0.1.3](https://github.com/mblarsen/browser-acl/compare/v0.1.2...v0.1.3) (2017-10-19)

## [0.1.2](https://github.com/mblarsen/browser-acl/compare/v0.1.1...v0.1.2) (2017-10-19)

## [0.1.1](https://github.com/mblarsen/browser-acl/compare/0143d8d...v0.1.1) (2017-10-19)

### Bug Fixes

- New verb doesn't flush old ones for subject ([0143d8d](https://github.com/mblarsen/browser-acl/commit/0143d8d))
