/* eslint-disable */
/**
 * @file Test code for replacing goog.isDefAndNotNull.
 */

var test1 = goog.isDefAndNotNull(someVar);
var test2 = goog.isDefAndNotNull(someObject.someProperty);
var test3 = goog.isDefAndNotNull(someObject[someProperty]);

var notTest1 = !goog.isDefAndNotNull(someVar);
var notTest2 = !goog.isDefAndNotNull(someObject.someProperty);
var notTest3 = !goog.isDefAndNotNull(someObject[someProperty]);

var castVar = /** @type {!test.Type} */ ({
  a: goog.isDefAndNotNull(someVar) ? someVar : false,
  b: false
});

//
// This transforms incorrectly because the ConditionalExpression LHS has leading comments and is parenthesized. When
// recast writes that back out, it incorrectly drops the comment but leaves the parentheses.
//
// The transform should warn the user that this happened.
//

var castProperty = goog.isDefAndNotNull(someObject['property']) ? /** @type {boolean} */ (someObject['property']) : false;

//
// This transforms incorrectly because the ReturnStatement is followed by leading comments and a parenthesized
// expression. When recast writes that back out, it incorrectly puts the comment inside the parentheses.
//
// The transform should remove the comment and warn the user.
//

var fn = function(someVar) {
  return /** @type {!test.Type} */ ({
    a: goog.isDefAndNotNull(someVar) ? someVar : false,
    b: false
  });
};
