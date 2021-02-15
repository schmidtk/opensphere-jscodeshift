/* eslint-disable */
/**
 * @file Test code for replacing goog.isFunction.
 */

var test1 = typeof someVar === 'function';
var test2 = typeof someObject.someProperty === 'function';
var test3 = typeof someObject[someProperty] === 'function';

var notTest1 = typeof someVar !== 'function';
var notTest2 = typeof someObject.someProperty !== 'function';
var notTest3 = typeof someObject[someProperty] !== 'function';

var castVar = /** @type {!test.Type} */ ({
  a: typeof someVar === 'function' ? someVar : '',
  b: false
});

//
// This transforms incorrectly because the ConditionalExpression LHS has leading comments and is parenthesized. When
// recast writes that back out, it incorrectly drops the comment but leaves the parentheses.
//
// The transform should warn the user that this happened.
//

var castProperty = typeof someObject['property'] === 'function' ? (someObject['property']) : '';

//
// This transforms incorrectly because the ReturnStatement is followed by leading comments and a parenthesized
// expression. When recast writes that back out, it incorrectly puts the comment inside the parentheses.
//
// The transform should remove the comment and warn the user.
//

var fn = function(someVar) {
  return ({
    a: typeof someVar === 'function' ? someVar : '',
    b: false
  });
};
