goog.provide('os.ns');


/**
 * An enum on the namespace.
 * @enum {string}
 */
os.ns.MyEnum = {
  KEY1: 'value1',
  KEY2: 'value2'
};


/**
 * A constant property on the namespace.
 * @type {string}
 * @const
 */
os.ns.CONSTANT_PROPERTY = 'Hello, World!';


/**
 * An assigned public mutable property on the namespace.
 * @type {boolean}
 */
os.ns.mutableProperty = false;


/**
 * An unassigned public mutable property on the namespace.
 * @type {Object|undefined}
 */
os.ns.unsetMutableProperty;


/**
 * An assigned private property on the namespace.
 * @type {boolean}
 * @private
 */
os.ns.privateProperty_ = true;


/**
 * An unassigned private property on the namespace.
 * @type {Object|undefined}
 * @private
 */
os.ns.unsetPrivateProperty_;


/**
 * Function on the namespace that references other namespace properties.
 * @param {string} arg1 An argument.
 * @param {boolean=} opt_arg2 Another argument.
 * @return {boolean} The return value.
 */
os.ns.someFn = function(arg1, opt_arg2) {
  if (os.ns.privateProperty_) {
    if (!os.ns.unsetPrivateProperty_) {
      os.ns.unsetPrivateProperty_ = {};
    }

    if (arg1 != null) {
      return os.ns.unsetPrivateProperty_[arg1];
    }
  }

  return opt_arg2 != null ? opt_arg2 : os.ns.mutableProperty;
};
