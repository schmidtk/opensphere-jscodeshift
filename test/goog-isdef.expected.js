/* eslint-disable */
/**
 * @fileoverview Test code for replacing goog.isDef.
 */

var test1 = someVar !== undefined;
var test2 = someObject.someProperty !== undefined;
var test3 = someObject[someProperty] !== undefined;

var notTest1 = someVar === undefined;
var notTest2 = someObject.someProperty === undefined;
var notTest3 = someObject[someProperty] === undefined;

var castVar = /** @type {!test.Type} */ ({
  a: someVar !== undefined ? someVar : false,
  b: false
});

//
// This transforms incorrectly because the returned ObjectExpression has both leading comments and is parenthesized.
// When jscodeshift writes that back out, it incorrectly puts the comment inside the parentheses. A warning should be
// displayed with the line number in the original file.
//

var castProperty = someObject['property'] !== undefined ? (someObject['property']) : false;

//
// This transforms incorrectly because the returned ObjectExpression has both leading comments and is parenthesized.
// When jscodeshift writes that back out, it incorrectly puts the comment inside the parentheses. A warning should be
// displayed with the line number in the original file.
//

var fn = function(someVar) {
  return (
    /** @type {!test.Type} */ {
      a: someVar !== undefined ? someVar : false,
      b: false
    }
  );
};
