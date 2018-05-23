/* eslint-disable */
/**
 * @fileoverview Test code for replacing goog.isDefAndNotNull.
 */

var test1 = someVar != null;
var test2 = someObject.someProperty != null;
var test3 = someObject[someProperty] != null;

var notTest1 = someVar == null;
var notTest2 = someObject.someProperty == null;
var notTest3 = someObject[someProperty] == null;

var castVar = /** @type {!test.Type} */ ({
  a: someVar != null ? someVar : false,
  b: false
});

//
// This transforms incorrectly because the returned ObjectExpression has both leading comments and is parenthesized.
// When jscodeshift writes that back out, it incorrectly puts the comment inside the parentheses. A warning should be
// displayed with the line number in the original file.
//

var castProperty = someObject['property'] != null ? (someObject['property']) : false;

//
// This transforms incorrectly because the returned ObjectExpression has both leading comments and is parenthesized.
// When jscodeshift writes that back out, it incorrectly puts the comment inside the parentheses. A warning should be
// displayed with the line number in the original file.
//

var fn = function(someVar) {
  return (
    /** @type {!test.Type} */ {
      a: someVar != null ? someVar : false,
      b: false
    }
  );
};
