"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalRule = void 0;
exports.GlobalRule = 'GLOBAL_RULE';
var assumeGlobal = function (sub) {
    return typeof sub === 'boolean' ||
        typeof sub === 'undefined' ||
        (typeof sub === 'function' && sub.name === '');
};
/**
 * Simple ACL library for the browser inspired by Laravel's guards and policies.
 */
var Acl = /** @class */ (function () {
    /**
     * browser-acl
     *
     * @access public
     */
    function Acl(_a) {
        var _b = (_a === void 0 ? {} : _a).strict, strict = _b === void 0 ? false : _b;
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
     */
    Acl.prototype.rule = function (verbs, subject, test) {
        var _this = this;
        if (test === void 0) { test = true; }
        var subject_;
        if (assumeGlobal(subject)) {
            test = typeof subject === 'undefined' ? true : subject;
            subject_ = exports.GlobalRule;
        }
        else {
            subject_ = subject;
        }
        var subjectName = this.subjectMapper(subject_);
        var verbs_ = Array.isArray(verbs) ? verbs : [verbs];
        verbs_.forEach(function (verb) {
            var rules = _this.rules.get(subjectName) || {};
            rules[verb] = test;
            _this.rules.set(subjectName, rules);
        });
        return this;
    };
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
     */
    Acl.prototype.policy = function (policy, subject) {
        var policy_ = typeof policy === 'function' ? new policy() : policy;
        var subjectName = this.subjectMapper(subject);
        this.policies.set(subjectName, policy_);
        return this;
    };
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
     */
    Acl.prototype.register = function (klass, subjectName) {
        this.registry.set(klass, subjectName);
        return this;
    };
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
     *   acl.can(user, 'create', Post)
     *   acl.can(user, 'edit', post)
     *   acl.can(user, 'edit', post, additionalParameter, secondAdditionalParameter)
     * ```
     *
     * Note that these are also available on the user if you've used
     * the mixin:
     *
     * ```javascript
     *   user.can('create', Post)
     *   user.can('edit', post)
     * ```
     *
     * @access public
     */
    Acl.prototype.can = function (user, verb, subject) {
        if (subject === void 0) { subject = undefined; }
        var args = [];
        for (var _i = 3; _i < arguments.length; _i++) {
            args[_i - 3] = arguments[_i];
        }
        subject = typeof subject === 'undefined' ? exports.GlobalRule : subject;
        var subjectName = this.subjectMapper(subject);
        var policy = this.policies.get(subjectName);
        var rules = policy || this.rules.get(subjectName);
        if (typeof rules === 'undefined') {
            if (this.strict) {
                throw new Error("No rules for subject \"" + subjectName + "\"");
            }
            return false;
        }
        if (policy && typeof policy.beforeAll === 'function') {
            var result = policy.beforeAll.apply(policy, __spreadArrays([verb, user, subject, subjectName], args));
            if (typeof result !== 'undefined') {
                return result;
            }
        }
        if (typeof rules[verb] === 'function') {
            return Boolean(rules[verb].apply(rules, __spreadArrays([user, subject, subjectName], args)));
        }
        if (this.strict && typeof rules[verb] === 'undefined') {
            throw new Error("Unknown verb \"" + verb + "\"");
        }
        return Boolean(rules[verb]);
    };
    /**
     * Like can but subject is an array where only some has to be
     * true for the rule to match.
     *
     * Note the subjects do not need to be of the same kind.
     *
     * @access public
     */
    Acl.prototype.some = function (user, verb, subjects) {
        var _this = this;
        var args = [];
        for (var _i = 3; _i < arguments.length; _i++) {
            args[_i - 3] = arguments[_i];
        }
        return subjects.some(function (s) { return _this.can.apply(_this, __spreadArrays([user, verb, s], args)); });
    };
    /**
     * Like can but subject is an array where all has to be
     * true for the rule to match.
     *
     * Note the subjects do not need to be of the same kind.
     *
     * @access public
     */
    Acl.prototype.every = function (user, verb, subjects) {
        var _this = this;
        var args = [];
        for (var _i = 3; _i < arguments.length; _i++) {
            args[_i - 3] = arguments[_i];
        }
        return subjects.every(function (s) { return _this.can.apply(_this, __spreadArrays([user, verb, s], args)); });
    };
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
     */
    Acl.prototype.mixin = function (User) {
        var acl = this;
        User.prototype.can = function (verb, subject) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            return acl.can.apply(acl, __spreadArrays([this, verb, subject], args));
        };
        User.prototype.can.every = function (verb, subjects) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            return acl.every.apply(acl, __spreadArrays([this, verb, subjects], args));
        };
        User.prototype.can.some = function (verb, subjects) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            return acl.some.apply(acl, __spreadArrays([this, verb, subjects], args));
        };
        return this;
    };
    /**
     * Rules are grouped by subjects and this default mapper tries to
     * map any non falsy input to a subject name.
     *
     * This is important when you want to try a verb against a rule
     * passing in an instance of a class.
     *
     * - strings becomes subjects
     * - function's names are used for subject
     * - object's constructor name is used for subject
     *
     * Override this function if your models do not match this approach.
     *
     * E.g. say that you are using plain data objects with a type property
     * to indicate the type of the object.
     *
     * ```javascript
     *   acl.subjectMapper = s => typeof s === 'string' ? s : s.type
     * ```
     *
     * `can` will now use this function when you pass in your objects.
     *
     * ```javascript
     * acl.rule('edit', 'book', (user, book) => user.id === book.authorId)
     * const thing = {title: 'The Silmarillion', authorId: 1, type: 'book'}
     * acl.can(user, 'edit', thing)
     * ```
     *
     * In the example above the 'thing' will follow the rules for 'book'. The
     * user can edit the book if they are the author.
     *
     * See {@link #register register()} for how to manually map
     * classes to subject name.
     *
     * @access public
     */
    Acl.prototype.subjectMapper = function (subject) {
        if (typeof subject === 'string') {
            return subject;
        }
        if (this.registry.has(subject)) {
            return this.registry.get(subject);
        }
        if (this.registry.has(subject.constructor)) {
            return this.registry.get(subject.constructor);
        }
        if (typeof subject === 'function') {
            return subject.name;
        }
        return subject.constructor.name;
    };
    /**
     * Removes all rules, policies, and registrations
     */
    Acl.prototype.reset = function () {
        this.rules = new Map();
        this.policies = new Map();
        this.registry = new WeakMap();
        return this;
    };
    /**
     * Remove rules for subject
     *
     * Optionally limit to a single verb.
     */
    Acl.prototype.removeRules = function (subject, verb) {
        if (verb === void 0) { verb = null; }
        var subjectName = this.subjectMapper(subject);
        if (this.rules.has(subjectName)) {
            if (verb) {
                var rules = this.rules.get(subjectName);
                if (rules) {
                    delete rules[verb];
                }
                return this;
            }
            this.rules.delete(subjectName);
        }
        return this;
    };
    /**
     * Remove policy for subject
     */
    Acl.prototype.removePolicy = function (subject) {
        var subjectName = this.subjectMapper(subject);
        this.policies.delete(subjectName);
        return this;
    };
    /**
     * Convenience method for removing all rules and policies for a subject
     */
    Acl.prototype.removeAll = function (subject) {
        this.removeRules(subject);
        this.removePolicy(subject);
        return this;
    };
    return Acl;
}());
exports.default = Acl;
