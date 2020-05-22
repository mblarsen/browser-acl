/**
 * Disable all 'smarts' and require you to be explicit.
 */
export interface Options {
  strict?: boolean
}

/**
 * Something that possibly has a beforeAll and otherwise
 * just a string-access.
 */
export interface Policy {
  beforeAll?: Function
  [key: string]: any
}

/**
 * Verbs or action: view, edit, delete, restore, etc.
 */
export type Verb = string

/**
 * The object of the verb. E.g. in the sentence: 'user edits post' here
 * 'post' is the verb object.
 */
export type VerbObject = string | Function | object

/**
 * A callback with determines of a user can perform an action
 */
export type TestFunction = (user?: any, ...args: any[]) => boolean

/**
 * The test for allowing the user to perform action
 */
export type Test = boolean | TestFunction

