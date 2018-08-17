module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/*!************************!*\
  !*** multi ./index.js ***!
  \************************/
/*! dynamic exports provided */
/*! all exports used */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(/*! /Users/mblarsen/workspace/mblarsen/browser-acl/index.js */1);


/***/ }),
/* 1 */
/*!******************!*\
  !*** ./index.js ***!
  \******************/
/*! exports provided: GlobalRule, default */
/*! all exports used */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "GlobalRule", function() { return GlobalRule; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "default", function() { return Acl; });
var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GlobalRule = 'GLOBAL_RULE';

var assumeGlobal = function assumeGlobal(sub) {
  return typeof sub === 'boolean' || typeof sub === 'undefined' || typeof sub === 'function' && sub.name === '';
};

/**
 * Simple ACL library for the browser inspired by Laravel's guards and policies.
 */

var Acl = function () {

  /**
   * browser-acl
   *
   * @access public
   * @param {Object} options
   * @param {Boolean} {strict=false}={} Errors out on unknown verbs when true
   * @returns {Acl}
   */
  function Acl() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$strict = _ref.strict,
        strict = _ref$strict === undefined ? false : _ref$strict;

    _classCallCheck(this, Acl);

    this.strict = strict;
    this.rules = new Map();
    this.policies = new Map();
    this.registry = new WeakMap();
  }

  /**
   * You add rules by providing a verb, a subject and an optional
   * test (that otherwise defaults to true).
   *
   * If the test is a function it will be evaluated with the params:
   * user, subject, and subjectName. The test value is ultimately evaluated
   * for truthiness.
   *
   * Examples:
   *
   * ```javascript
   * acl.rule('create', Post)
   * acl.rule('edit', Post, (user, post) => post.userId === user.id)
   * acl.rule('edit', Post, (user, post, verb, additionalParameter, secondAdditionalParameter) => true)
   * acl.rule('delete', Post, false) // deleting disabled
   * acl.rule('purgeInactive', user => user.isAdmin) // global rule
   * ```
   *
   * @access public
   * @param {Array<string>|string} verbs
   * @param {Function|Object|string} subject?
   * @param {Boolean|Function} test=true
   * @returns {Acl}
   */


  _createClass(Acl, [{
    key: 'rule',
    value: function rule(verbs, subject) {
      var _this = this;

      var test = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

      if (assumeGlobal(subject)) {
        test = typeof subject === 'undefined' ? true : subject;
        subject = GlobalRule;
      }
      var subjectName = this.subjectMapper(subject);
      var verbs_ = Array.isArray(verbs) ? verbs : [verbs];
      verbs_.forEach(function (verb) {
        var rules = _this.rules.get(subjectName) || {};
        rules[verb] = test;
        _this.rules.set(subjectName, rules);
      });
      return this;
    }

    /**
     * You can group related rules into policies for a subject. The policies
     * properties are verbs and they can plain values or functions.
     *
     * If the policy is a function it will be new'ed up before use.
     *
     * ```javascript
     *   class Post {
     *     constructor() {
     *       this.view = true       // no need for a functon
     *       this.delete = false    // not really necessary since an abscent
     *                              // verb has the same result
     *     }
     *     beforeAll(verb, user, ...theRest) {
     *       if (user.isAdmin) {
     *         return true
     *       }
     *       // return nothing (undefined) to pass it on to the other rules
     *     }
     *     edit(user, post, verb, additionalParameter, secondAdditionalParameter) {
     *       return post.id === user.id
     *     }
     *   }
     * ```
     *
     * Policies are useful for grouping rules and adding more complex logic.
     *
     * @access public
     * @param {Object} policy A policy with properties that are verbs
     * @param {Function|Object|string} subject
     * @returns {Acl}
     */

  }, {
    key: 'policy',
    value: function policy(_policy, subject) {
      var policy_ = typeof _policy === 'function' ? new _policy() : _policy;
      var subjectName = this.subjectMapper(subject);
      this.policies.set(subjectName, policy_);
      return this;
    }

    /**
     * Explicitly map a class or constructor function to a name.
     *
     * You would want to do this in case your code is heavily
     * minified in which case the default mapper cannot use the
     * simple "reflection" to resolve the subject name.
     *
     * Note: If you override the subjectMapper this is not used,
     * bud it can be used manually through `this.registry`.
     *
     * @access public
     * @param {Function} klass A class or constructor function
     * @param {string} subjectName
     */

  }, {
    key: 'register',
    value: function register(klass, subjectName) {
      this.registry.set(klass, subjectName);
      return this;
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
     * ```javascript
     *   acl->can(user, 'create', Post)
     *   acl->can(user, 'edit', post)
     *   acl->can(user, 'edit', post, additionalParameter, secondAdditionalParameter)
     * ```
     *
     * Note that these are also available on the user if you've used
     * the mixin:
     *
     * ```javascript
     *   user->can('create', Post)
     *   user->can('edit', post)
     * ```
     *
     * @access public
     * @param {Object} user
     * @param {string} verb
     * @param {Function|Object|string} subject
     * @param {...*} args Any other param is passed into rule
     * @return Boolean
     */

  }, {
    key: 'can',
    value: function can(user, verb, subject) {
      subject = typeof subject === 'undefined' ? GlobalRule : subject;
      var subjectName = this.subjectMapper(subject);

      var policy = this.policies.get(subjectName);
      var rules = policy || this.rules.get(subjectName);

      if (typeof rules === 'undefined') {
        if (this.strict) {
          throw new Error('Unknown subject "' + subjectName + '"');
        }
        return false;
      }

      for (var _len = arguments.length, args = Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
        args[_key - 3] = arguments[_key];
      }

      if (policy && typeof policy.beforeAll === 'function') {
        var result = policy.beforeAll.apply(policy, [verb, user, subject, subjectName].concat(args));
        if (typeof result !== 'undefined') {
          return result;
        }
      }

      if (typeof rules[verb] === 'function') {
        return Boolean(rules[verb].apply(rules, [user, subject, subjectName].concat(args)));
      }

      if (this.strict && typeof rules[verb] === 'undefined') {
        throw new Error('Unknown verb "' + verb + '"');
      }

      return Boolean(rules[verb]);
    }

    /**
     * Like can but subject is an array where only some has to be
     * true for the rule to match.
     *
     * Note the subjects do not need to be of the same kind.
     *
     * @access public
     * @param {Object} user
     * @param {Array<Function|Object|string>} subjects
     * @param {...*} args Any other param is passed into rule
     * @return Boolean
     */

  }, {
    key: 'some',
    value: function some(user, verb, subjects) {
      for (var _len2 = arguments.length, args = Array(_len2 > 3 ? _len2 - 3 : 0), _key2 = 3; _key2 < _len2; _key2++) {
        args[_key2 - 3] = arguments[_key2];
      }

      var _this2 = this;

      return subjects.some(function (s) {
        return _this2.can.apply(_this2, [user, verb, s].concat(args));
      });
    }

    /**
     * Like can but subject is an array where all has to be
     * true for the rule to match.
     *
     * Note the subjects do not need to be of the same kind.
     *
     * @access public
     * @param {Object} user
     * @param {Array<Function|Object|string>} subjects
     * @param {...*} args Any other param is passed into rule
     * @return Boolean
     */

  }, {
    key: 'every',
    value: function every(user, verb, subjects) {
      for (var _len3 = arguments.length, args = Array(_len3 > 3 ? _len3 - 3 : 0), _key3 = 3; _key3 < _len3; _key3++) {
        args[_key3 - 3] = arguments[_key3];
      }

      var _this3 = this;

      return subjects.every(function (s) {
        return _this3.can.apply(_this3, [user, verb, s].concat(args));
      });
    }

    /**
     * Mix in augments your user class with a `can` function object. This
     * is optional and you can always call `can` directly on your
     * Acl instance.
     *
     * ```
     * user.can()
     * user.can.some()
     * user.can.every()
     * ```
     *
     * @access public
     * @param {Function} User A user class or contructor function
     */

  }, {
    key: 'mixin',
    value: function mixin(User) {
      var acl = this;
      User.prototype.can = function () {
        return acl.can.apply(acl, [this].concat(Array.prototype.slice.call(arguments)));
      };
      User.prototype.can.every = function () {
        return acl.every.apply(acl, [this].concat(Array.prototype.slice.call(arguments)));
      };
      User.prototype.can.some = function () {
        return acl.some.apply(acl, [this].concat(Array.prototype.slice.call(arguments)));
      };
      return this;
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
     * ```javascript
     *   acl.subjectMapper = s => typeof s === 'string' ? s : s.type
     * ```
     *
     * `can` will now use this function when you pass in your objects.
     *
     * See {@link #register register()} for how to manually map
     * classes to subject name.
     *
     * @access public
     * @param {Function|Object|string} subject
     * @returns {string} A subject
     */

  }, {
    key: 'subjectMapper',
    value: function subjectMapper(subject) {
      if (typeof subject === 'string') {
        return subject;
      }
      var isFun = typeof subject === 'function';
      if (isFun && this.registry.has(subject)) {
        return this.registry.get(subject);
      }
      if (!isFun && this.registry.has(subject.constructor)) {
        return this.registry.get(subject.constructor);
      }
      return isFun ? subject.name : subject.constructor.name;
    }

    /**
     * Removes all rules, policies, and registrations
     *
     * @returns {Acl}
     */

  }, {
    key: 'reset',
    value: function reset() {
      this.rules = new Map();
      this.policies = new Map();
      this.registry = new WeakMap();
      return this;
    }

    /**
     * Remove rules for subject
     *
     * Optionally limit to a single verb.
     *
     * @param {Object|Function|String} subject
     * @param {?String} [verb=null] an optional verb
     * @returns {Acl}
     */

  }, {
    key: 'removeRules',
    value: function removeRules(subject) {
      var verb = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

      var subjectName = this.subjectMapper(subject);
      if (this.rules.has(subjectName)) {
        if (verb) {
          var rules = this.rules.get(subjectName);
          delete rules[verb];
          return this;
        }
        this.rules.delete(subjectName);
      }
      return this;
    }

    /**
     * Remove policy for subject
     *
     * @param {Object|Function|String} subject
     * @returns {Acl}
     */

  }, {
    key: 'removePolicy',
    value: function removePolicy(subject) {
      var subjectName = this.subjectMapper(subject);
      this.policies.delete(subjectName);
      return this;
    }

    /**
     * Convenience method for removing all rules and policies for a subject
     *
     * @param {Object|Function|String} subject
     * @returns {Acl}
     */

  }, {
    key: 'removeAll',
    value: function removeAll(subject) {
      this.removeRules(subject);
      this.removePolicy(subject);
      return this;
    }
  }]);

  return Acl;
}();



/***/ })
/******/ ]);
//# sourceMappingURL=browser-acl.js.map