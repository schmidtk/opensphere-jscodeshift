/**
 * @fileoverview Some comments at the top of the file that shouldn't be dropped.
 */
goog.provide('os');


/**
 * An enum on the namespace.
 * @enum {string}
 */
os.MyEnum = {
  KEY1: 'value1',
  KEY2: 'value2'
};


/**
 * A constant property on the namespace.
 * @type {string}
 * @const
 */
os.CONSTANT_PROPERTY = 'Hello, World!';


/**
 * An assigned public mutable property on the namespace.
 * @type {boolean}
 */
os.mutableProperty = false;


/**
 * An unassigned public mutable property on the namespace.
 * @type {Object|undefined}
 */
os.unsetMutableProperty;


/**
 * An assigned private property on the namespace.
 * @type {boolean}
 * @private
 */
os.privateProperty_ = true;


/**
 * An unassigned private property on the namespace.
 * @type {Object|undefined}
 * @private
 */
os.unsetPrivateProperty_;


/**
 * Function on the namespace that references other namespace properties.
 * @param {string} arg1 An argument.
 * @param {boolean=} opt_arg2 Another argument.
 * @return {boolean} The return value.
 */
os.someFn = function(arg1, opt_arg2) {
  if (os.privateProperty_) {
    if (!os.unsetPrivateProperty_) {
      os.unsetPrivateProperty_ = {};
    }

    if (arg1 != null) {
      return os.unsetPrivateProperty_[arg1];
    }
  }

  return opt_arg2 != null ? opt_arg2 : os.mutableProperty;
};
