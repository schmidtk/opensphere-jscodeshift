/**
 * @file Replaces `goog.isNumber` calls with an equivalent binary expression.
 */

const callToBinary = require('../../calltobinary');

module.exports = (file, api, options) => {
  const root = callToBinary(file, {
    callee: {
      object: {name: 'goog'},
      property: {name: 'isNumber'}
    }
  }, {
    expression: '!=',
    notExpression: '==',
    rightSide: api.jscodeshift.literal('number')
  });

  // print
  return root.toSource({quote: 'single'});
};
