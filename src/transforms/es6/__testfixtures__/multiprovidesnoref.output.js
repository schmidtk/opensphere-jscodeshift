goog.module('os.ns.MyClass');
goog.module.declareLegacyNamespace();

goog.require('os.ns');


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
  }

  /**
   * A function on the class.
   * @param {string} arg1 First arg.
   * @param {number=} opt_arg2 Optional second arg.
   * @return {boolean}
   */
  memberFn(arg1, opt_arg2) {
    return !!arg1;
  }
}

exports = MyClass;
