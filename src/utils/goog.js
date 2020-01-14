const jscs = require('jscodeshift');

/**
 * Regular expression to detect @const JSDoc annotation.
 * @type {RegExp}
 */
const CONST_REGEXP = /@const([\s]+.*)?/;

const getObjectProperty = (key, value) => {
  const property = jscs.property('init', jscs.identifier(key), value || jscs.identifier(key));
  property.shorthand = true;
  return property;
};

const getObjectProperties = (keys, values) => {
  return typeof keys === 'string' ? [getObjectProperty(keys, values)] :
      keys.map((key, idx, arr) => getObjectProperty(key, values ? values[idx] : undefined));
};

/**
 * Add exports to the source.
 * @param {NodePath} root The root node path.
 * @param {Array<string>|string} keys The export key(s). Use a string for default export, or array of strings for
 *                                    non-default exports.
 * @param {Array<Node>|Node} values Values to assign to the export(s).
 */
const addExports = (root, keys, values) => {
  const programs = root.find(jscs.Program);
  if (programs.length) {
    const program = programs.get().value;

    const existingAssignmentExpr = root.find(jscs.AssignmentExpression, {
      left: {type: 'Identifier', name: 'exports'}
    });

    let existingExports;
    if (existingAssignmentExpr.length) {
      existingExports = existingAssignmentExpr.get();

      // if the file is currently using a default export, convert it
      if (existingExports.value.right.type === 'Identifier') {
        const currentName = existingExports.value.right.name;
        existingExports.value.right = jscs.objectExpression([getObjectProperty(currentName)]);
      }
    }

    if (!existingExports && typeof keys === 'string' && !values) {
      // single default export
      const assignment = jscs.assignmentExpression('=', jscs.identifier('exports'), jscs.identifier(keys));
      program.body.push(jscs.expressionStatement(assignment));
    } else {
      // non-default exports
      const properties = getObjectProperties(keys, values);

      if (existingExports) {
        // add keys to existing exports
        const existingObjExpr = existingExports.value.right;
        existingObjExpr.properties = existingObjExpr.properties.concat(properties);
      } else {
        // create a new exports assignment
        const assignmentValue = jscs.objectExpression(properties);
        const assignment = jscs.assignmentExpression('=', jscs.identifier('exports'), assignmentValue);
        program.body.push(jscs.expressionStatement(assignment));
      }
    }
  }
};

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
 * If a node represents an interface.
 * @param {Node} node The node.
 * @return {boolean}
 */
const isInterface = node => {
  if (node && node.comments && node.comments.length === 1) {
    return node.comments[0].value.indexOf('@interface') > -1;
  }
  return false;
};

/**
 * If a node is marked constant in its comments.
 * @param {Node} node The node.
 * @return {boolean}
 */
const isConst = (node) => {
  if (node && node.comments && node.comments.length === 1) {
    return CONST_REGEXP.test(node.comments[0].value);
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
  addExports,
  addRequire,
  isGoogProvide,
  isGoogRequire,
  isClosureClass,
  isControllerClass,
  isDirective,
  isInterface,
  isConst,
  isPrivate,
  sortRequires
};
