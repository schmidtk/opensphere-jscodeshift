const jscs = require('jscodeshift');

const addExports = (root, program, keys) => {
  if (typeof keys === 'string') {
    // single default export
    const assignment = jscs.assignmentExpression('=', jscs.identifier('exports'), jscs.identifier(keys));
    program.body.push(jscs.expressionStatement(assignment));
  } else {
    // non-default exports
    const properties = keys.map(key => {
      const property = jscs.property('init', jscs.identifier(key), jscs.identifier(key));
      property.shorthand = true;
      return property;
    });

    const existing = root.find(jscs.AssignmentExpression, {
      left: {type: 'Identifier', name: 'exports'},
      right: {type: 'ObjectExpression'}
    });

    if (existing.length) {
      // add keys to existing exports
      const existingObjExpr = existing.get().value.right;
      existingObjExpr.properties = existingObjExpr.properties.concat(properties);
    } else {
      // create a new exports assignment
      const assignmentValue = jscs.objectExpression(properties);
      const assignment = jscs.assignmentExpression('=', jscs.identifier('exports'), assignmentValue);
      program.body.push(jscs.expressionStatement(assignment));
    }
  }

};

module.exports = {addExports};
