/* eslint-disable */
/**
 * @file Test code for replacing goog.isNumber.
 */

var test1 = typeof someVar === 'number';
var test2 = typeof someObject.someProperty === 'number';
var test3 = typeof someObject[someProperty] === 'number';

var notTest1 = typeof someVar !== 'number';
var notTest2 = typeof someObject.someProperty !== 'number';
var notTest3 = typeof someObject[someProperty] !== 'number';

var castVar = /** @type {!test.Type} */ ({
  a: typeof someVar === 'number' ? someVar : 0,
  b: false
});

//
// This transforms incorrectly because the ConditionalExpression LHS has leading comments and is parenthesized. When
// recast writes that back out, it incorrectly drops the comment but leaves the parentheses.
//
// The transform should warn the user that this happened.
//

var castProperty = typeof someObject['property'] === 'number' ? (someObject['property']) : 0;

//
// This transforms incorrectly because the ReturnStatement is followed by leading comments and a parenthesized
// expression. When recast writes that back out, it incorrectly puts the comment inside the parentheses.
//
// The transform should remove the comment and warn the user.
//

var fn = function(someVar) {
  return ({
    a: typeof someVar === 'number' ? someVar : 0,
    b: false
  });
};
