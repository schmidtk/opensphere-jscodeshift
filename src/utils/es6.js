const jscs = require('jscodeshift');

const getObjectProperty = (key) => {
  const property = jscs.property('init', jscs.identifier(key), jscs.identifier(key));
  property.shorthand = true;
  return property;
};

const getObjectProperties = (keys) => {
  return typeof keys === 'string' ? [getObjectProperty(keys)] : keys.map(getObjectProperty);
};

/**
 * Add exports to the source.
 * @param {NodePath} root The root node path.
 * @param {Array<string>|string} keys The export key(s). Use a string for default export, or array of strings for
 *                                    non-default exports.
 */
const addExports = (root, keys) => {
  const programs = root.find(jscs.Program);
  if (programs.length) {
    const program = programs.get().value;

    const existingAssignmentExpr = root.find(jscs.AssignmentExpression, {
      left: {type: 'Identifier', name: 'exports'}
    });

    let existingExports;
    if (existingAssignmentExpr.length) {
      existingExports = existingAssignmentExpr.get();
      if (existingExports.value.right.type === 'Identifier') {
        const currentName = existingExports.value.right.name;
        existingExports.value.right = jscs.objectExpression([getObjectProperty(currentName)]);
      }
    }

    if (!existingExports && typeof keys === 'string') {
      // single default export
      const assignment = jscs.assignmentExpression('=', jscs.identifier('exports'), jscs.identifier(keys));
      program.body.push(jscs.expressionStatement(assignment));
    } else {
      // non-default exports
      const properties = getObjectProperties(keys);

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

module.exports = {addExports};
