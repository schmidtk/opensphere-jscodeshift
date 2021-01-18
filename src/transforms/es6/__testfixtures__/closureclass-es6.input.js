goog.module('os.ns.MyClass');
goog.module.declareLegacyNamespace();

const os1 = goog.require('os1');
const ParentClass = goog.require('os.ns.ParentClass');
const SomeType1 = goog.require('os.ns.SomeType1');
const os2 = goog.requireType('os2');
const SomeType2 = goog.requireType('os.ns.SomeType2');


goog.require('notReferencedPleaseRemove');
goog.require('os.ns.NotReferencedPleaseRemove');

/**
 * Class description.
 *
 * Additional description.
 */
class MyClass extends ParentClass {
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

    /**
     * Verify types are replaced in code & comments.
     * @type {SomeType1}
     */
    this.typeTest1 = new SomeType1();

    /**
     * Verify types are replaced in comments alone.
     * @type {SomeType1}
     */
    this.typeTest2 = null;

    /**
     * Reference os1 in code (goog.require), os2 in comments (requireType).
     * @type {os2.Thing}
     */
    this.typeTest3 = os1.getAThing();

    /**
     * Reference os1 in code (goog.require), os2 in comments (requireType).
     * @type {SomeType2}
     */
    this.typeTest4 = null;
  }

  /**
   * A function on the class.
   * @param {string} arg1 First arg.
   * @param {number=} opt_arg2 Optional second arg.
   * @return {boolean}
   */
  memberFn(arg1, opt_arg2) {
    if (arg1 === MyClass.CONSTANT) {
      goog.log.fine(MyClass.LOGGER_, 'Some message');
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
}

os.implements(MyClass, os.ns.ISomeInterface.ID);
os.implements(MyClass, os.ns.IAnotherInterface.ID);
goog.addSingletonGetter(MyClass);


/**
 * Class name registered with OpenSphere.
 * @type {string}
 * @const
 */
MyClass.NAME = 'os.ns.MyClass';
os.registerClass(MyClass.NAME, MyClass);


/**
 * A private constant on the class.
 * @type {goog.log.Logger}
 * @private
 * @const
 */
MyClass.LOGGER_ = goog.log.getLogger(MyClass.NAME);

/**
 * A constant on the class.
 * @type {string}
 * @const
 */
MyClass.CONSTANT = 'Hello';


/**
 * A private constant on the class.
 * @type {string}
 * @private
 * @const
 */
MyClass.PRIVATE_CONSTANT_ = 'World';


/**
 * A private property on the class.
 * @type {string}
 * @private
 */
MyClass.foo_ = 'bar';


/**
 * @inheritDoc
 */
MyClass.prototype.overrideToExpression = goog.nullFunction;
exports = MyClass;
