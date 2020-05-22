export interface Options {
    /** Disable all 'smarts' and require you to be explicit. */
    strict?: boolean;
}
/**
 * Something that possibly has a beforeAll and otherwise
 * just a string-access.
 */
export interface Policy {
    beforeAll?: Function;
    [key: string]: any;
}
/**
 * Verbs or action: view, edit, delete, restore, etc.
 */
export declare type Verb = string;
/**
 *
 */
export declare type VerbObject = string | Function | object;
export declare type VerbObjectName = string | undefined;
export declare type VerbObjectOrTest = VerbObject | boolean;
export declare type TestFunction = (user?: any, ...args: any[]) => boolean;
export declare type Test = boolean | TestFunction;
/**
 * Simple ACL library for the browser inspired by Laravel's guards and policies.
 */
declare class Acl {
    static GlobalRule: string;
    strict: boolean;
    rules: Map<VerbObjectName, {
        [key: string]: Test;
    }>;
    policies: Map<VerbObjectName | undefined, Policy>;
    registry: WeakMap<Object, string>;
    /**
     * browser-acl
     *
     * @access public
     */
    constructor({ strict }?: Options);
    /**
     * You add rules by providing a verb, a verb object and an optional
     * test (that otherwise defaults to true).
     *
     * If the test is a function it will be evaluated with the params:
     * user, verbObject, and verbObjectName. The test value is ultimately evaluated
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
    rule(verbs: Verb | Verb[], verbObject: VerbObjectOrTest, test?: Test): this;
    /**
     * You can group related rules into policies for a verb object. The policies
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
    policy(policy: Policy, verbObject: VerbObject): this;
    /**
     * Explicitly map a class or constructor function to a name.
     *
     * You would want to do this in case your code is heavily
     * minified in which case the default mapper cannot use the
     * simple "reflection" to resolve the verb object name.
     *
     * Note: If you override the verbObjectMapper this is not used,
     * bud it can be used manually through `this.registry`.
     *
     * @access public
     */
    register(klass: Function, verbObjectName: string): this;
    /**
     * Performs a test if a user can perform action on verb object.
     *
     * The action is a verb and the verb object can be anything the
     * verbObjectMapper can map to a verb object name.
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
    can(user: Object, verb: Verb, verbObject?: VerbObject | undefined, ...args: any[]): any;
    /**
     * Like can but verb object is an array where only some has to be
     * true for the rule to match.
     *
     * Note the verb objects do not need to be of the same kind.
     *
     * @access public
     */
    some(user: object, verb: Verb, verbObjects: VerbObject[], ...args: any[]): boolean;
    /**
     * Like can but verbObject is an array where all has to be
     * true for the rule to match.
     *
     * Note the verb objects do not need to be of the same kind.
     *
     * @access public
     */
    every(user: Object, verb: Verb, verbObjects: VerbObject[], ...args: any[]): boolean;
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
    mixin(User: Function): this;
    /**
     * Rules are grouped by verb objects and this default mapper tries to
     * map any non falsy input to a verb object name.
     *
     * This is important when you want to try a verb against a rule
     * passing in an instance of a class.
     *
     * - strings becomes verb objects
     * - function's names are used for verb object
     * - object's constructor name is used for verb object
     *
     * Override this function if your models do not match this approach.
     *
     * E.g. say that you are using plain data objects with a type property
     * to indicate the type of the object.
     *
     * ```javascript
     *   acl.verbObjectMapper = s => typeof s === 'string' ? s : s.type
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
     * classes to verb object name.
     *
     * @access public
     */
    verbObjectMapper(verbObject: VerbObject): VerbObjectName;
    /**
     * Removes all rules, policies, and registrations
     */
    reset(): this;
    /**
     * Remove rules for verb object
     *
     * Optionally limit to a single verb.
     */
    removeRules(verbObject: VerbObject, verb?: Verb | null): this;
    /**
     * Remove policy for verb object
     */
    removePolicy(verbObject: VerbObject): this;
    /**
     * Convenience method for removing all rules and policies for a verb object
     */
    removeAll(verbObject: VerbObject): this;
}
export default Acl;
