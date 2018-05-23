/* eslint-disable */
/**
 * @fileoverview Test code for replacing `goog.exportProperty` with `@export`.
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
 * Does things.
 * @param {string} param1 Params things.
 * @param {string=} opt_param2 Maybe params things.
 */
test.Object.prototype.fn1 = function(param1, opt_param2) {
  // exports stuff to window
  goog.exportProperty(window, 'doObjThangs1', test.Object.prototype.fn2);
  goog.exportProperty(window, 'doObjThangs2', test.Object.prototype.fn3);
};
goog.exportProperty(test.Object.prototype, 'fn1', test.Object.prototype.fn1);


/**
 * Does things too, but not exported.
 * @param {string} param1 Params things.
 * @param {string=} opt_param2 Maybe params things.
 */
test.Object.prototype.fn2 = function(param1, opt_param2) {

};


/**
 * Does things as well, and is exported.
 * @param {string} param1 Params things.
 * @param {string=} opt_param2 Maybe params things.
 */
test.Object.prototype.fn3 = function(param1, opt_param2) {

};
goog.exportProperty(test.Object.prototype, 'fn3', test.Object.prototype.fn3);


/**
 * Does things also, and exports them to another thing.
 * @param {string} param1 Params things.
 * @param {string=} opt_param2 Maybe params things.
 */
test.Object.prototype.fn4 = function(param1, opt_param2) {

};
goog.exportProperty(test.Object.prototype, 'notFn4', test.Object.prototype.fn4);
