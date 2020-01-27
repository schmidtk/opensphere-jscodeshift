goog.module('os.ns.MyClass');
goog.module.declareLegacyNamespace();


/**
 * Class description.
 */
class MyClass {
  /**
   * Constructor.
   */
  constructor() {}

  /**
   * A function on the class.
   */
  memberFn(arg1) {
    //
    // replaces function with arrow function and removes this
    //

    new goog.Promise((resolve, reject) => {
      // do things
    });

    goog.array.forEach(arg1, (el) => {
      // do things
    });

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

    setTimeout(() => 'Waited!', 100);

    setTimeout(goog.bind(() => 'Waited with args!', undefined, arg1), 100);

    //
    // only handles generic listen calls when the arguments seem to fit
    //

    this.listen('some-event', (event) => {
      // converted to arrow
    }, false);

    this.listen('some-event', function(event) {
      // not converted to arrow
    });

    // doesn't error
    this.listen();
  }
}

exports = MyClass;
