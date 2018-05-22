/* eslint-disable */
/**
 * @fileoverview Test code for replacing goog.isDef.
 */

var test1 = goog.isDef(someVar);
var test2 = goog.isDef(someObject.someProperty);
var test3 = goog.isDef(someObject[someProperty]);

var notTest1 = !goog.isDef(someVar);
var notTest2 = !goog.isDef(someObject.someProperty);
var notTest3 = !goog.isDef(someObject[someProperty]);

var castVar = /** @type {!test.Type} */ ({
  a: goog.isDef(someVar) ? someVar : false,
  b: false
});

//
// This transforms incorrectly because the returned ObjectExpression has both leading comments and is parenthesized.
// When jscodeshift writes that back out, it incorrectly puts the comment inside the parentheses. A warning should be
// displayed with the line number in the original file.
//

var castProperty = goog.isDef(someObject['property']) ? /** @type {boolean} */ (someObject['property']) : false;

//
// This transforms incorrectly because the returned ObjectExpression has both leading comments and is parenthesized.
// When jscodeshift writes that back out, it incorrectly puts the comment inside the parentheses. A warning should be
// displayed with the line number in the original file.
//

var fn = function(someVar) {
  return /** @type {!test.Type} */ ({
    a: goog.isDef(someVar) ? someVar : false,
    b: false
  });
};
