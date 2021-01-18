/**
 * @fileoverview Some comments at the top of the file that shouldn't be dropped.
 */
goog.declareModuleId('os.ns');

/**
 * An enum on the namespace.
 * @enum {string}
 */
export const MyEnum = {
  KEY1: 'value1',
  KEY2: 'value2'
};

/**
 * A constant property on the namespace.
 * @type {string}
 */
export const CONSTANT_PROPERTY = 'Hello, World!';

/**
 * An assigned public mutable property on the namespace.
 * @type {boolean}
 */
export const mutableProperty = false;

/**
 * An unassigned public mutable property on the namespace.
 * @type {Object|undefined}
 */
export let unsetMutableProperty;

/**
 * An assigned private property on the namespace.
 * @type {boolean}
 */
const privateProperty_ = true;

/**
 * An unassigned private property on the namespace.
 * @type {Object|undefined}
 */
let unsetPrivateProperty_;

/**
 * Function on the namespace that references other namespace properties.
 * @param {string} arg1 An argument.
 * @param {boolean=} opt_arg2 Another argument.
 * @return {boolean} The return value.
 */
export const someFn = function(arg1, opt_arg2) {
  if (privateProperty_) {
    if (!unsetPrivateProperty_) {
      unsetPrivateProperty_ = {};
    }

    if (arg1 != null) {
      return unsetPrivateProperty_[arg1];
    }
  }

  return opt_arg2 != null ? opt_arg2 : mutableProperty;
};
