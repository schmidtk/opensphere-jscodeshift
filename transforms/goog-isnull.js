const callToBinary = require('../scripts/calltobinary');

module.exports = (file, api, options) => {
  const root = callToBinary(file, api, {
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
