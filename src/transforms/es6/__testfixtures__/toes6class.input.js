goog.provide('os.ns.MyClass');

goog.require('os.ns.ParentClass');


/**
 * Class description.
 * @param {string} arg1 First arg.
 * @param {number} arg2 Second arg.
 * @param {boolean=} opt_arg3 Optional arg.
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


/**
 * A constant on the class.
 * @type {string}
 * @const
 */
os.ns.MyClass.CONSTANT = 'Hello';


/**
 * A function on the class.
 * @param {string} arg1 First arg.
 * @param {number=} opt_arg2 Optional second arg.
 * @return {boolean}
 */
os.ns.MyClass.prototype.memberFn = function(arg1, opt_arg2) {
  if (arg1) {
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
