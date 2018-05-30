/* eslint-disable */
/**
 * @file Test code for replacing `goog.exportProperty` with `@export`.
 */
goog.provide('test.Object');


/**
 * Just an object, doing object thangs.
 * @constructor
 */
test.Object = function() {
  /**
   * @type {boolean}
   */
  this.doesThangs = true;

  this.fn1();
};


/**
 * Normal use of goog.exportProperty.
 * @param {string} param1 Required param.
 * @param {string=} opt_param2 Optional param.
 * @export
 */
test.Object.prototype.fn1 = function(param1, opt_param2) {
  // exports stuff to window
  window['doObjThangs1'] = test.Object.prototype.fn2;
  window['doObjThangs2'] = test.Object.prototype.fn3;
};


/**
 * Not exported.
 * @param {string} param1 Required param.
 * @param {string=} opt_param2 Optional param.
 */
test.Object.prototype.fn2 = function(param1, opt_param2) {

};


/**
 * Exported and protected.
 * @param {string} param1 Required param.
 * @param {string=} opt_param2 Optional param.
 * @export
 */
test.Object.prototype.fn3 = function(param1, opt_param2) {

};


/**
 * Exported to a different function name.
 * @param {string} param1 Required param.
 * @param {string=} opt_param2 Optional param.
 */
test.Object.prototype.fn4 = function(param1, opt_param2) {

};
test.Object.prototype['notFn4'] = test.Object.prototype.fn4;
