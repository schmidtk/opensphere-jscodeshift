/* eslint-disable */
/**
 * @file Test code for replacing goog.isDef.
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
// This transforms incorrectly because the ConditionalExpression LHS has leading comments and is parenthesized. When
// recast writes that back out, it incorrectly drops the comment but leaves the parentheses.
//
// The transform should warn the user that this happened.
//

var castProperty = someObject['property'] !== undefined ? (someObject['property']) : false;

//
// This transforms incorrectly because the ReturnStatement is followed by leading comments and a parenthesized
// expression. When recast writes that back out, it incorrectly puts the comment inside the parentheses.
//
// The transform should remove the comment and warn the user.
//

var fn = function(someVar) {
  return {
    a: someVar !== undefined ? someVar : false,
    b: false
  };
};
