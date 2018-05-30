/**
 * @file Replaces `goog.isString` calls with an equivalent binary expression.
 */

const callToBinary = require('../../calltobinary');

module.exports = (file, api, options) => {
  const root = callToBinary(file, {
    callee: {
      object: {name: 'goog'},
      property: {name: 'isString'}
    }
  }, {
    expression: '!=',
    notExpression: '==',
    rightSide: api.jscodeshift.literal('string')
  });

  // print
  return root.toSource({quote: 'single'});
};
