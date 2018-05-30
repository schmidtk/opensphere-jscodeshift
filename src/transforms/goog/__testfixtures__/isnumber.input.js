/* eslint-disable */
/**
 * @file Test code for replacing goog.isNumber.
 */

var test1 = goog.isNumber(someVar);
var test2 = goog.isNumber(someObject.someProperty);
var test3 = goog.isNumber(someObject[someProperty]);

var notTest1 = !goog.isNumber(someVar);
var notTest2 = !goog.isNumber(someObject.someProperty);
var notTest3 = !goog.isNumber(someObject[someProperty]);

var castVar = /** @type {!test.Type} */ ({
  a: goog.isNumber(someVar) ? someVar : 0,
  b: false
});

//
// This transforms incorrectly because the ConditionalExpression LHS has leading comments and is parenthesized. When
// recast writes that back out, it incorrectly drops the comment but leaves the parentheses.
//
// The transform should warn the user that this happened.
//

var castProperty = goog.isNumber(someObject['property']) ? /** @type {number} */ (someObject['property']) : 0;

//
// This transforms incorrectly because the ReturnStatement is followed by leading comments and a parenthesized
// expression. When recast writes that back out, it incorrectly puts the comment inside the parentheses.
//
// The transform should remove the comment and warn the user.
//

var fn = function(someVar) {
  return /** @type {!test.Type} */ ({
    a: goog.isNumber(someVar) ? someVar : 0,
    b: false
  });
};
