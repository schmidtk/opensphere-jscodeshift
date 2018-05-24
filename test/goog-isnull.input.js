/* eslint-disable */
/**
 * @file Test code for replacing goog.isNull.
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
// This transforms incorrectly because the ConditionalExpression LHS has leading comments and is parenthesized. When
// recast writes that back out, it incorrectly drops the comment but leaves the parentheses.
//
// The transform should warn the user that this happened.
//

var castProperty = goog.isNull(someObject['property']) ? /** @type {boolean} */ (someObject['property']) : false;

//
// This transforms incorrectly because the ReturnStatement is followed by leading comments and a parenthesized
// expression. When recast writes that back out, it incorrectly puts the comment inside the parentheses.
//
// The transform should remove the comment and warn the user.
//

var fn = function(someVar) {
  return /** @type {!test.Type} */ ({
    a: goog.isNull(someVar) ? someVar : false,
    b: false
  });
};
