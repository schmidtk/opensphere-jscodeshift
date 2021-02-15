/**
 * @file Replaces `goog.isFunction` calls with an equivalent binary expression.
 */

const callToBinary = require('../../utils/calltobinary');
const prependTypeof = require('../../utils/prependtypeof');
const {getDefaultSourceOptions} = require('../../utils/options');

module.exports = (file, api, options) => {
  const root = callToBinary(file, {
    callee: {
      object: {name: 'goog'},
      property: {name: 'isFunction'}
    }
  }, {
    expression: '===',
    notExpression: '!==',
    leftSide: prependTypeof,
    rightSide: api.jscodeshift.literal('function')
  });

  // print
  return root.toSource(getDefaultSourceOptions());
};
