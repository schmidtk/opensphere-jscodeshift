goog.provide('os.ns.MyClass');


/**
 * Class description.
 * @constructor
 */
os.ns.MyClass = function() {};


/**
 * A function on the class.
 */
os.ns.MyClass.prototype.memberFn = function(arg1) {
  //
  // replaces function with arrow function and removes this
  //

  new goog.Promise(function(resolve, reject) {
    // do things
  }, this);

  goog.array.forEach(arg1, function(el) {
    // do things
  }, this);

  //
  // does not replace the function if "this" is not explicitly provided
  //

  new goog.Promise(function(resolve, reject) {
    // do things
  });

  goog.array.forEach(arg1, function(el) {
    // do things
  }, arg1);

  //
  // drops goog.bind when no other args are provided. uses inline arrow function when the function only contains a
  // return statement
  //

  setTimeout(goog.bind(function() {
    return 'Waited!';
  }, this), 100);

  setTimeout(goog.bind(function() {
    return 'Waited with args!';
  }, this, arg1), 100);

  //
  // only handles generic listen calls when the arguments seem to fit
  //

  this.listen('some-event', function(event) {
    // converted to arrow
  }, false, this);

  this.listen('some-event', function(event) {
    // not converted to arrow
  });

  // doesn't error
  this.listen();
};
