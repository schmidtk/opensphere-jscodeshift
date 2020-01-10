goog.module('os.ns.MyClass');

goog.module.declareLegacyNamespace();

goog.require('os.ns.ParentClass');


/**
 * A private constant on the class.
 * @type {string}
 */
const PRIVATE_CONSTANT_ = 'World';

/**
 * Class description.
 */
class MyClass extends os.ns.ParentClass {
  /**
   * Constructor.
   * @param {string} arg1 First arg.
   * @param {number} arg2 Second arg.
   * @param {boolean=} opt_arg3 Optional arg.
   */
  constructor(arg1, arg2, opt_arg3) {
    super(arg1, arg2);

    /**
     * A public property on the class.
     * @type {string}
     */
    this.prop1 = 'Hello';

    /**
     * A protected property on the class.
     * @type {string}
     * @protected
     */
    this.prop2 = 'World';

    /**
     * A private property on the class.
     * @type {string}
     * @private
     */
    this.prop3_ = '!!!';
  }

  /**
   * A function on the class.
   * @param {string} arg1 First arg.
   * @param {number=} opt_arg2 Optional second arg.
   * @return {boolean}
   */
  memberFn(arg1, opt_arg2) {
    if (arg1 === os.ns.MyClass.CONSTANT) {
      return true;
    }

    return false;
  }

  /**
   * @inheritDoc
   */
  overrideFn(arg1, opt_arg2) {
    return super.overrideFn(arg1);
  }

  /**
   * @inheritDoc
   */
  oldOverrideFn(arg1, opt_arg2) {
    return super.oldOverrideFn(arg1);
  }

  /**
   * @inheritDoc
   */
  oldOverrideDifferentClass(arg1, opt_arg2) {
    // can't convert due to difference in class
    return os.ns.AnotherClass.superClass_.oldOverrideDifferentClass.call(this, arg1);
  }

  /**
   * A constant on the class.
   * @type {string}
   */
  static get CONSTANT() {
    return 'Hello';
  }
}


/**
 * @inheritDoc
 */
MyClass.prototype.overrideToExpression = goog.nullFunction;
exports = MyClass;
