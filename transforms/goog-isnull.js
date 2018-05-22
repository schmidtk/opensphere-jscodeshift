module.exports = (file, api, options) => {
  const j = api.jscodeshift;
  const root = j(file.source);

  // find call expressions for goog.isNull
  root.find(j.CallExpression, {
    callee: {
      object: {name: 'goog'},
      property: {name: 'isNull'}
    }
  }).forEach(p => {
    const parentNode = p.parent.node;
    const leftSide = p.node.arguments[0];
    const rightSide = j.identifier('null');

    if (parentNode.type === 'UnaryExpression' && parentNode.operator === '!') {
      // replace `!goog.isNull(arg)` with `arg === null`
      j(p.parent).replaceWith(pp => j.binaryExpression('===', leftSide, rightSide));
    } else {
      // replace `goog.isNull(arg)` with `arg !== null`
      j(p).replaceWith(pp => j.binaryExpression('!==', leftSide, rightSide));
    }
  });

  // print
  return root.toSource();
};
