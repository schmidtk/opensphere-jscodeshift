/**
 * @file Replaces `goog.isDefAndNotNull` calls with an equivalent binary expression.
 */

const callToBinary = require('../../calltobinary');

module.exports = (file, api, options) => {
  const root = callToBinary(file, {
    callee: {
      object: {name: 'goog'},
      property: {name: 'isDefAndNotNull'}
    }
  }, {
    expression: '!=',
    notExpression: '==',
    rightSide: api.jscodeshift.identifier('null')
  });

  // print
  return root.toSource();
};
