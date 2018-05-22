/* eslint-disable */
/**
 * @fileoverview Test code for replacing goog.isNull.
 */

var test1 = goog.isNull(someVar);
var test2 = goog.isNull(someObject.someProperty);
var test3 = goog.isNull(someObject[someProperty]);

var notTest1 = !goog.isNull(someVar);
var notTest2 = !goog.isNull(someObject.someProperty);
var notTest3 = !goog.isNull(someObject[someProperty]);

var castVar = /** @type {!test.Type} */ ({
  a: goog.isNull(someVar) ? someVar : false,
  b: false
});

//
// This transforms incorrectly because the returned ObjectExpression has both leading comments and is parenthesized.
// When jscodeshift writes that back out, it incorrectly puts the comment inside the parentheses. A warning should be
// displayed with the line number in the original file.
//

var castProperty = goog.isNull(someObject['property']) ? /** @type {boolean} */ (someObject['property']) : false;

//
// This transforms incorrectly because the returned ObjectExpression has both leading comments and is parenthesized.
// When jscodeshift writes that back out, it incorrectly puts the comment inside the parentheses. A warning should be
// displayed with the line number in the original file.
//

var fn = function(someVar) {
  return /** @type {!test.Type} */ ({
    a: goog.isNull(someVar) ? someVar : false,
    b: false
  });
};
