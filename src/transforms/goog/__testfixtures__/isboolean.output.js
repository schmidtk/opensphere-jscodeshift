/* eslint-disable */
/**
 * @file Test code for replacing goog.isBoolean.
 */

var test1 = typeof someVar === 'boolean';
var test2 = typeof someObject.someProperty === 'boolean';
var test3 = typeof someObject[someProperty] === 'boolean';

var notTest1 = typeof someVar !== 'boolean';
var notTest2 = typeof someObject.someProperty !== 'boolean';
var notTest3 = typeof someObject[someProperty] !== 'boolean';

var castVar = /** @type {!test.Type} */ ({
  a: typeof someVar === 'boolean' ? someVar : false,
  b: false
});

//
// This transforms incorrectly because the ConditionalExpression LHS has leading comments and is parenthesized. When
// recast writes that back out, it incorrectly drops the comment but leaves the parentheses.
//
// The transform should warn the user that this happened.
//

var castProperty = typeof someObject['property'] === 'boolean' ? (someObject['property']) : false;

//
// This transforms incorrectly because the ReturnStatement is followed by leading comments and a parenthesized
// expression. When recast writes that back out, it incorrectly puts the comment inside the parentheses.
//
// The transform should remove the comment and warn the user.
//

var fn = function(someVar) {
  return ({
    a: typeof someVar === 'boolean' ? someVar : false,
    b: false
  });
};
