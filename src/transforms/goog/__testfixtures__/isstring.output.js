/* eslint-disable */
/**
 * @file Test code for replacing goog.isString.
 */

var test1 = someVar != 'string';
var test2 = someObject.someProperty != 'string';
var test3 = someObject[someProperty] != 'string';

var notTest1 = someVar == 'string';
var notTest2 = someObject.someProperty == 'string';
var notTest3 = someObject[someProperty] == 'string';

var castVar = /** @type {!test.Type} */ ({
  a: someVar != 'string' ? someVar : '',
  b: false
});

//
// This transforms incorrectly because the ConditionalExpression LHS has leading comments and is parenthesized. When
// recast writes that back out, it incorrectly drops the comment but leaves the parentheses.
//
// The transform should warn the user that this happened.
//

var castProperty = someObject['property'] != 'string' ? (someObject['property']) : '';

//
// This transforms incorrectly because the ReturnStatement is followed by leading comments and a parenthesized
// expression. When recast writes that back out, it incorrectly puts the comment inside the parentheses.
//
// The transform should remove the comment and warn the user.
//

var fn = function(someVar) {
  return {
    a: someVar != 'string' ? someVar : '',
    b: false
  };
};
