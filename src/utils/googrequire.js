const jscs = require('jscodeshift');

/**
 * If a node is a `goog.array.find` call.
 * @param {Node} node The node.
 * @return {boolean}
 */
const isGoogRequire = node => {
  return node.type === 'CallExpression' && jscs.match(node, {
    callee: {
      object: {name: 'goog'},
      property: {name: 'require'}
    }
  });
};

/**
 * Add a goog.require statement if it doesn't already exist.
 * @param {Node} root The root node.
 * @param {string} toAdd The require to add.
 */
const add = (root, toAdd) => {
  const requires = root.find(jscs.CallExpression, isGoogRequire);
  if (!requires.some(path => path.node.arguments[0] === toAdd)) {
    const callee = jscs.memberExpression(jscs.identifier('goog'), jscs.identifier('require'));
    const call = jscs.callExpression(callee, [jscs.literal(toAdd)]);
    requires.paths()[0].parent.insertAfter(jscs.expressionStatement(call));
    sort(root);
  }
};

/**
 * Sort goog.require statements.
 * @param {Node} root The root node.
 */
const sort = root => {
  const requires = [];

  root.find(jscs.CallExpression, isGoogRequire).forEach(path => {
    requires.push(path.value.arguments[0].value);
  });

  requires.sort();

  root.find(jscs.CallExpression, isGoogRequire).forEach((path, idx, arr) => {
    const callee = jscs.memberExpression(jscs.identifier('goog'), jscs.identifier('require'));
    const call = jscs.callExpression(callee, [jscs.literal(requires[idx])]);
    jscs(path).replaceWith(call);
  });
};


module.exports = {
  add: add,
  sort: sort
};
