goog.provide('os.ns.MyClass');

goog.require('os.ns.ParentClass');


/**
 * Class description.
 *
 * Additional description.
 *
 * @param {string} arg1 First arg.
 * @param {number} arg2 Second arg.
 * @param {boolean=} opt_arg3 Optional arg.
 *
 * @extends {os.ns.ParentClass}
 * @constructor
 */
os.ns.MyClass = function(arg1, arg2, opt_arg3) {
  os.ns.MyClass.base(this, 'constructor', arg1, arg2);

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
};
goog.inherits(os.ns.MyClass, os.ns.ParentClass);
os.implements(os.ns.MyClass, os.ns.ISomeInterface.ID);
os.implements(os.ns.MyClass, os.ns.IAnotherInterface.ID);
goog.addSingletonGetter(os.ns.MyClass);


/**
 * Class name registered with OpenSphere.
 * @type {string}
 * @const
 */
os.ns.MyClass.NAME = 'os.ns.MyClass';
os.registerClass(os.ns.MyClass.NAME, os.ns.MyClass);


/**
 * A private constant on the class.
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.ns.MyClass.LOGGER_ = goog.log.getLogger(os.ns.MyClass.NAME);

/**
 * A constant on the class.
 * @type {string}
 * @const
 */
os.ns.MyClass.CONSTANT = 'Hello';


/**
 * A private constant on the class.
 * @type {string}
 * @private
 * @const
 */
os.ns.MyClass.PRIVATE_CONSTANT_ = 'World';


/**
 * A private property on the class.
 * @type {string}
 * @private
 */
os.ns.MyClass.foo_ = 'bar';


/**
 * A function on the class.
 * @param {string} arg1 First arg.
 * @param {number=} opt_arg2 Optional second arg.
 * @return {boolean}
 */
os.ns.MyClass.prototype.memberFn = function(arg1, opt_arg2) {
  if (arg1 === os.ns.MyClass.CONSTANT) {
    goog.log.fine(os.ns.MyClass.LOGGER_, 'Some message');
    return true;
  }

  return false;
};


/**
 * @inheritDoc
 */
os.ns.MyClass.prototype.overrideFn = function(arg1, opt_arg2) {
  return os.ns.MyClass.base(this, 'overrideFn', arg1);
};


/**
 * @inheritDoc
 */
os.ns.MyClass.prototype.oldOverrideFn = function(arg1, opt_arg2) {
  return os.ns.MyClass.superClass_.oldOverrideFn.call(this, arg1);
};


/**
 * @inheritDoc
 */
os.ns.MyClass.prototype.oldOverrideDifferentClass = function(arg1, opt_arg2) {
  // can't convert due to difference in class
  return os.ns.AnotherClass.superClass_.oldOverrideDifferentClass.call(this, arg1);
};


/**
 * @inheritDoc
 */
os.ns.MyClass.prototype.overrideToExpression = goog.nullFunction;
