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
 * If a node is a `goog.array.find` call.
 * @param {Node} node The node.
 * @return {boolean}
 */
const isGoogProvide = node => {
  return node.type === 'CallExpression' && jscs.match(node, {
    callee: {
      object: {name: 'goog'},
      property: {name: 'provide'}
    }
  });
};

/**
 * If a node represents a Closure class constructor.
 * @param {Node} node The node.
 * @return {boolean}
 */
const isClosureClass = node => {
  if (node && node.comments && node.comments.length === 1) {
    return node.comments[0].value.indexOf('@constructor') > -1;
  }
  return false;
};

/**
 * If a node represents a Closure class constructor.
 * @param {Node} node The node.
 * @return {boolean}
 */
const isControllerClass = node => {
  if (isClosureClass(node)) {
    return node.comments[0].value.indexOf('@ngInject') > -1;
  }
  return false;
};

/**
 * If a node represents a Closure class constructor.
 * @param {Node} node The node.
 * @return {boolean}
 */
const isDirective = node => {
  if (node && node.comments && node.comments.length === 1) {
    return node.comments[0].value.indexOf('angular.Directive') > -1;
  }
  return false;
};

/**
 * If a node is marked private in its comments.
 * @param {Node} node The node.
 * @return {boolean}
 */
const isPrivate = (node) => {
  if (node && node.comments && node.comments.length === 1) {
    return node.comments[0].value.indexOf('@private') > -1;
  }
  return false;
};

/**
 * Add a goog.declareLegacyNamespace statement after a node.
 * @param {Node} node The node.
 */
const addLegacyNamespace = node => {
  const googModule = jscs.memberExpression(jscs.identifier('goog'), jscs.identifier('module'));
  const callee = jscs.memberExpression(googModule, jscs.identifier('declareLegacyNamespace'));
  const call = jscs.callExpression(callee, []);
  node.insertAfter(jscs.expressionStatement(call));
};

/**
 * Add a goog.require statement if it doesn't already exist.
 * @param {Node} root The root node.
 * @param {string} toAdd The require to add.
 */
const addRequire = (root, toAdd) => {
  const requires = root.find(jscs.CallExpression, isGoogRequire);
  if (!requires.some(path => path.node.arguments[0].value === toAdd)) {
    let paths = requires.paths();
    if (!paths.length) {
      const provides = root.find(jscs.CallExpression, isGoogProvide);
      paths = provides.paths();
    }

    if (paths.length) {
      const callee = jscs.memberExpression(jscs.identifier('goog'), jscs.identifier('require'));
      const call = jscs.callExpression(callee, [jscs.literal(toAdd)]);
      paths[0].parent.insertAfter(jscs.expressionStatement(call));
      sortRequires(root);
    }
  }
};

/**
 * Sort goog.require statements.
 * @param {Node} root The root node.
 */
const sortRequires = root => {
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
  addLegacyNamespace,
  addRequire,
  isGoogProvide,
  isGoogRequire,
  isClosureClass,
  isControllerClass,
  isDirective,
  isPrivate,
  sortRequires
};
