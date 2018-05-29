/* eslint-disable */
/**
 * @file Test code for replacing goog.isNull.
 */

var test1 = someVar !== null;
var test2 = someObject.someProperty !== null;
var test3 = someObject[someProperty] !== null;

var notTest1 = someVar === null;
var notTest2 = someObject.someProperty === null;
var notTest3 = someObject[someProperty] === null;

var castVar = /** @type {!test.Type} */ ({
  a: someVar !== null ? someVar : false,
  b: false
});

//
// This transforms incorrectly because the ConditionalExpression LHS has leading comments and is parenthesized. When
// recast writes that back out, it incorrectly drops the comment but leaves the parentheses.
//
// The transform should warn the user that this happened.
//

var castProperty = someObject['property'] !== null ? (someObject['property']) : false;

//
// This transforms incorrectly because the ReturnStatement is followed by leading comments and a parenthesized
// expression. When recast writes that back out, it incorrectly puts the comment inside the parentheses.
//
// The transform should remove the comment and warn the user.
//

var fn = function(someVar) {
  return {
    a: someVar !== null ? someVar : false,
    b: false
  };
};
