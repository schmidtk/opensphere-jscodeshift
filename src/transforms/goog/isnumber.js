/**
 * @file Replaces `goog.isNumber` calls with an equivalent binary expression.
 */

const callToBinary = require('../../utils/calltobinary');
const prependTypeof = require('../../utils/prependtypeof');
const {getDefaultSourceOptions} = require('../../utils/sourceoptions');

module.exports = (file, api, options) => {
  const root = callToBinary(file, {
    callee: {
      object: {name: 'goog'},
      property: {name: 'isNumber'}
    }
  }, {
    expression: '===',
    notExpression: '!==',
    leftSide: prependTypeof,
    rightSide: api.jscodeshift.literal('number')
  });

  // print
  return root.toSource(getDefaultSourceOptions());
};
