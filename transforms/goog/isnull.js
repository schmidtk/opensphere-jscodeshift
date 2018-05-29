/**
 * @file Replaces `goog.isNull` calls with an equivalent binary expression.
 */

const callToBinary = require('../../scripts/calltobinary');

module.exports = (file, api, options) => {
  const root = callToBinary(file, {
    callee: {
      object: {name: 'goog'},
      property: {name: 'isNull'}
    }
  }, {
    expression: '!==',
    notExpression: '===',
    rightSide: api.jscodeshift.identifier('null')
  });

  // print
  return root.toSource();
};
