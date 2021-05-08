goog.module('os.ns.MyClass');
goog.module.declareLegacyNamespace();

const MY_CONSTANT = goog.require('os.ns.MY_CONSTANT');
const MyEnum = goog.require('os.ns.MyEnum');


/**
 * Class description.
 */
class MyClass {
  /**
   * Constructor.
   * @param {string} arg1 First arg.
   * @param {number} arg2 Second arg.
   * @param {boolean=} opt_arg3 Optional arg.
   */
  constructor(arg1, arg2, opt_arg3) {
    /**
     * A public property on the class, assigned to an enum value.
     * @type {string}
     */
    this.prop1 = MyEnum.KEY1;

    /**
     * A protected property on the class, assigned to an enum value.
     * @type {string}
     * @protected
     */
    this.prop2 = MyEnum.KEY2;
  }

  /**
   * A function on the class.
   * @param {string} arg1 First arg.
   * @param {number=} opt_arg2 Optional second arg.
   * @return {boolean}
   */
  memberFn(arg1, opt_arg2) {
    return arg1 === MY_CONSTANT;
  }
}

exports = MyClass;
