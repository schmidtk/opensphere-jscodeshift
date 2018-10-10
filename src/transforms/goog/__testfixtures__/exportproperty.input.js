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
 */
test.Object.prototype.fn1 = function(param1, opt_param2) {
  // exports stuff to window
  goog.exportProperty(window, 'doObjThangs1', test.Object.prototype.fn2);
  goog.exportProperty(window, 'doObjThangs2', test.Object.prototype.fn3);
};
goog.exportProperty(test.Object.prototype, 'fn1', test.Object.prototype.fn1);


/**
 * Not exported.
 * @param {string} param1 Required param.
 * @param {string=} opt_param2 Optional param.
 */
test.Object.prototype.fn2 = function(param1, opt_param2) {
  this.fn4_('arg');

  var boundFn4 = this.fn4_.bind(this);
  boundFn4('arg1', 'arg2');
};


/**
 * Exported and protected.
 * @param {string} param1 Required param.
 * @param {string=} opt_param2 Optional param.
 * @protected
 */
test.Object.prototype.fn3 = function(param1, opt_param2) {

};
goog.exportProperty(test.Object.prototype, 'fn3', test.Object.prototype.fn3);


/**
 * Exported and private.
 * @param {string} param1 Required param.
 * @param {string=} opt_param2 Optional param.
 * @private
 */
test.Object.prototype.fn4_ = function(param1, opt_param2) {

};
goog.exportProperty(test.Object.prototype, 'fn4', test.Object.prototype.fn4_);


/**
 * Exported to a different function name.
 * @param {string} param1 Required param.
 * @param {string=} opt_param2 Optional param.
 */
test.Object.prototype.fn5 = function(param1, opt_param2) {

};
goog.exportProperty(test.Object.prototype, 'notFn5', test.Object.prototype.fn5);
