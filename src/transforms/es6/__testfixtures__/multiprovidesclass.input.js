goog.provide('os.ns.MY_CONSTANT');
goog.provide('os.ns.MyClass');
goog.provide('os.ns.MyEnum');


/**
 * An enum provided by the file.
 * @enum {string}
 */
os.ns.MyEnum = {
  KEY1: 'value1',
  KEY2: 'value2'
};


/**
 * A constant provided by the file.
 * @type {string}
 * @const
 */
os.ns.MY_CONSTANT = 'Hello!';


/**
 * Class description.
 *
 * @param {string} arg1 First arg.
 * @param {number} arg2 Second arg.
 * @param {boolean=} opt_arg3 Optional arg.
 *
 * @constructor
 */
os.ns.MyClass = function(arg1, arg2, opt_arg3) {
  /**
   * A public property on the class, assigned to an enum value.
   * @type {string}
   */
  this.prop1 = os.ns.MyEnum.KEY1;

  /**
   * A protected property on the class, assigned to an enum value.
   * @type {string}
   * @protected
   */
  this.prop2 = os.ns.MyEnum.KEY2;
};


/**
 * A function on the class.
 * @param {string} arg1 First arg.
 * @param {number=} opt_arg2 Optional second arg.
 * @return {boolean}
 */
os.ns.MyClass.prototype.memberFn = function(arg1, opt_arg2) {
  return arg1 === os.ns.MY_CONSTANT;
};
