const jscs = require('jscodeshift');

const {
  copyComments,
  createFindCallFn,
  createFindMemberExprObject,
  getUniqueVarName,
  isCall,
  isInComment,
  isReferenced,
  replaceInComments
} = require('./ast');

const {createCall} = require('./jscs');
const {logger} = require('./logger');

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
 * Add goog.module exports to the source.
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
 * Get the goog exports assignment expression.
 * @param {NodePath} root The root node path.
 * @return {NodePath|undefined} The exports, or undefined if not found.
 */
const getGoogModuleExports = (root) => {
  let moduleExports;

  const exprPaths = root.find(jscs.AssignmentExpression, {
    left: {
      type: 'Identifier',
      name: 'exports'
    },
    operator: '='
  }).paths();

  if (exprPaths && exprPaths.length === 1) {
    moduleExports = exprPaths[0];
  }

  return moduleExports;
};


/**
 * If a node is a `goog.module.declareLegacyNamespace` call.
 * @param {Node} node The node.
 * @return {boolean}
 */
const isGoogDeclareLegacyNamespace = node => {
  return node.type === 'ExpressionStatement' && isCall(node.expression, 'goog.module.declareLegacyNamespace');
};


/**
 * If a node is a `goog.define` call.
 * @param {Node} node The node.
 * @return {boolean}
 */
const isGoogDefine = node => {
  return node.type === 'ExpressionStatement' && isCall(node.expression, 'goog.define');
};


/**
 * If a node is a `goog.module` call.
 * @param {Node} node The node.
 * @return {boolean}
 */
const isGoogModule = node => {
  return node.type === 'ExpressionStatement' && isCall(node.expression, 'goog.module');
};


/**
 * If a node is a `goog.require` variable assignment.
 * @param {Node} node The node.
 * @return {boolean}
 */
const isGoogModuleRequire = node => {
  return node.type === 'VariableDeclaration' && jscs.match(node, {
    declarations: [{
      type: 'VariableDeclarator',
      init: {
        type: 'CallExpression',
        callee: createFindMemberExprObject('goog.require')
      }
    }]
  });
};


/**
 * If a node is a `goog.requireType` variable assignment.
 * @param {Node} node The node.
 * @return {boolean}
 */
const isGoogModuleRequireType = node => {
  return node.type === 'VariableDeclaration' && jscs.match(node, {
    declarations: [{
      type: 'VariableDeclarator',
      init: {
        type: 'CallExpression',
        callee: createFindMemberExprObject('goog.requireType')
      }
    }]
  });
};


/**
 * If a node is a `goog.array.find` call.
 * @param {Node} node The node.
 * @return {boolean}
 */
const isGoogRequire = node => {
  return node.type === 'ExpressionStatement' && isCall(node.expression, 'goog.require');
};


/**
 * If a node is a `goog.array.find` call.
 * @param {Node} node The node.
 * @return {boolean}
 */
const isGoogProvide = node => {
  return node.type === 'ExpressionStatement' && isCall(node.expression, 'goog.provide');
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
  const requires = root.find(jscs.ExpressionStatement, isGoogRequire);
  if (!requires.some(path => path.node.expression.arguments[0].value === toAdd)) {
    const program = root.find(jscs.Program).get();
    const programBody = program.value.body;
    for (let i = 0; i < programBody.length; i++) {
      const current = programBody[i];
      if (!isGoogModule(current) && !isGoogDeclareLegacyNamespace(current) && !isGoogProvide(current) &&
          !isGoogModuleRequire(current) && !isGoogModuleRequireType(current)) {
        const insertIndex = isGoogRequire(current) ? i + 1 : i;
        const callee = jscs.memberExpression(jscs.identifier('goog'), jscs.identifier('require'));
        const call = jscs.callExpression(callee, [jscs.literal(toAdd)]);
        programBody.splice(insertIndex, 0, jscs.expressionStatement(call));

        sortRequires(root);

        break;
      }
    }
  }
};


/**
 * Replace a legacy goog.require statement to use the module return value.
 * @param {Node} root The root node.
 * @param {string} toReplace The str to replace.
 * @param {?string} toReplaceAlt The str to require.
 * @param {?boolean} singleton if true, include getInstance() in call
 * @return {?string} The legacy require namespace, or null if replaced.
 */
const replaceLegacyRequire = (root, toReplace, toReplaceAlt, singleton) => {
  // remove existing goog.require calls for the module
  const expr = {
    expression: {
      callee: createFindMemberExprObject('goog.require'),
      arguments: [{value: toReplace}]
    }
  };
  root.find(jscs.ExpressionStatement, expr).remove();

  if (toReplaceAlt) {
    expr.expression.arguments = [{value: toReplaceAlt}];
    root.find(jscs.ExpressionStatement, expr).remove();
  }

  let requireCall;

  if (isReferenced(root, toReplace)) {
    // referenced in the file - use goog.require
    requireCall = 'require';
  } else if (isInComment(root, toReplace)) {
    // only referenced in comments - use goog.requireType
    requireCall = 'requireType';
  } else {
    // bail if the module isn't referenced in the file
    return toReplace;
  }

  // create a variable name that doesn't shadow any local vars
  const varName = getUniqueVarName(root, toReplace);

  // create the variable declaration
  const callee = jscs.memberExpression(jscs.identifier('goog'), jscs.identifier(requireCall));
  const call = jscs.callExpression(callee, [jscs.literal(toReplaceAlt || toReplace)]);
  const varDeclarator = jscs.variableDeclarator(jscs.identifier(varName), call);
  const varDeclaration = jscs.variableDeclaration('const', [varDeclarator]);

  // insert the declaration after goog.module and legacy goog.require statements
  const program = root.find(jscs.Program).get();
  const programBody = program.value.body;
  for (let i = 0; i < programBody.length; i++) {
    const current = programBody[i];
    if (!isGoogModule(current) && !isGoogDeclareLegacyNamespace(current) && !isGoogProvide(current) && !isGoogRequire(current)) {
      programBody.splice(i, 0, varDeclaration);
      break;
    }
  }

  let replaceWith = jscs.identifier(varName);

  // add .getInstance() if needed for the in-line replacements
  if (singleton === true) {
    replaceWith = jscs.memberExpression(replaceWith, jscs.identifier('getInstance'));
    replaceWith = jscs.callExpression(replaceWith, []);
  }

  // replace references to the fully qualified class name with the local variable name
  root.find(jscs.MemberExpression, createFindMemberExprObject(toReplace))
      .forEach(path => jscs(path).replaceWith(replaceWith));

  // replace references in comments
  replaceInComments(root, toReplace, varName);

  return null;
};


/**
 * If the document is using a default export.
 * @param {NodePath} root The root node.
 */
const isDefaultExport = (root) => {
  const moduleExports = getGoogModuleExports(root);
  if (moduleExports) {
    const exportsType = moduleExports.value.right.type;
    return exportsType === 'Identifier';
  }

  return false;
};


/**
 * Find the declaration of a goog named export and create an ES6 named export declaration.
 * @param {NodePath} root The root node.
 * @param {Node} prop The exported property.
 */
const createNamedExport = (root, prop) => {
  if (prop && prop.value) {
    // If the property is shorthand or the value is an Identifier, find the reference in the file and export it inline
    if (prop.shorthand || prop.value.type === 'Identifier') {
      const propName = prop.value.name;

      const varDeclarations = root.find(jscs.VariableDeclaration, {
        declarations: [{
          type: 'VariableDeclarator',
          id: {name: propName}
        }]
      });

      if (varDeclarations && varDeclarations.length) {
        varDeclarations.forEach(exportNamedDeclaration);
      }

      const classDeclarations = root.find(jscs.ClassDeclaration, {
        id: {name: propName}
      });

      if (classDeclarations && classDeclarations.length) {
        classDeclarations.forEach((classDecl) => {
          //
          // HACK: The Closure Compiler currently won't process @ngInject within a class if the class has an inline
          // export. To work around this, we'll leave the class definition and put the export on its own line.
          //
          // https://github.com/google/closure-compiler/issues/3766
          //
          const ngInjectIdx = jscs(classDecl).toSource().indexOf('@ngInject');
          if (ngInjectIdx > -1) {
            //
            // HACK: This should be creating a ExportNamedDeclaration with an ExportSpecifier, but the ExportSpecifier
            // builder is currently broken in recast. To work around this, we'll create/parse a snippet that contains
            // the node we want and add that node to the program body.
            //
            // https://github.com/benjamn/ast-types/issues/425
            //
            const controllerName = classDecl.value.id.name;
            const controllerTemp = jscs(`class ${controllerName} {}\nexport {${controllerName}};`);
            const namedExport = controllerTemp.find(jscs.Program).get().value.body[1];

            const program = root.find(jscs.Program).get().value;
            program.body.push(namedExport);
          } else {
            exportNamedDeclaration(classDecl);
          }
        });
      }
    }
  }
};


/**
 * Add a named export to a path node.
 * @param {NodePath} path The path node.
 */
const exportNamedDeclaration = (path) => {
  const namedExport = jscs.exportNamedDeclaration(path.value);
  copyComments(path.value, namedExport);

  jscs(path).replaceWith(namedExport);
};


/**
 * Replace goog.module exports with ES6 exports.
 * @param {NodePath} root The root node.
 * @return {boolean} If the module is using a default export.
 */
const replaceModuleExportsWithEs6 = (root) => {
  let isDefault = false;

  const moduleExports = getGoogModuleExports(root);
  if (moduleExports) {
    const exportsType = moduleExports.value.right.type;
    if (exportsType === 'Identifier') {
      const exportDefaultDecl = jscs.exportDefaultDeclaration(jscs.identifier(moduleExports.value.right.name));
      jscs(moduleExports.parent).replaceWith(exportDefaultDecl);

      isDefault = true;
    } else if (exportsType === 'ObjectExpression') {
      const exportedProps = moduleExports.value.right.properties;
      if (exportedProps && exportedProps.length) {
        //
        // Named exports should be using shorthand notation, while a default export object will not.
        //
        // Named exports:
        //
        //   exports = {EXPORT_1, export2, Export3};
        //
        // Default object export (typically used to export an enum):
        //
        //   exports = {
        //     EXPORT_1: 'value1',
        //     EXPORT_2: 'value2'
        //   }
        //
        exportedProps.forEach((prop) => {
          isDefault = isDefault || (prop && !prop.shorthand);
        });

        if (isDefault) {
          const exportDefaultDecl = jscs.exportDefaultDeclaration(moduleExports.value.right);
          copyComments(moduleExports.parent.value, exportDefaultDecl);

          jscs(moduleExports.parent).replaceWith(exportDefaultDecl);
        } else {
          exportedProps.forEach((prop) => {
            createNamedExport(root, prop);
          });

          // remove the exports expression
          jscs(moduleExports.parent).remove();
        }
      } else {
        logger.warn('No properties found in exports object.');
      }
    } else {
      logger.warn(`Unsupported exports type: ${exportsType}`);
    }
  }

  return isDefault;
};


/**
 * Remove goog.module.declareLegacyNamespace statement.
 * @param {NodePath} root The root node.
 */
const removeLegacyNamespace = (root) => {
  // remove goog.module.declareLegacyNamespace calls - this can only be called within a goog.module
  const findLegacyNs = createFindCallFn('goog.module.declareLegacyNamespace');
  root.find(jscs.CallExpression, findLegacyNs).forEach((path, idx, paths) => {
    jscs(path).remove();
  });
};


/**
 * Gets a temporary ES6 module name, when using a shim for the original.
 * @param {string} moduleName The original module name.
 * @return {string} The temp module name.
 */
const getTempModuleName = (moduleName) => `${moduleName}Temp`;


/**
 * Replace goog.module statement with goog.declareModuleId.
 * @param {NodePath} root The root node.
 * @return {string|undefined} The declared module name.
 */
const replaceModuleWithDeclareModuleId = (root) => {
  const isDefault = isDefaultExport(root);

  const findFn = createFindCallFn('goog.module');
  const moduleCalls = root.find(jscs.CallExpression, findFn);
  const path = moduleCalls.paths()[0];
  if (!path) {
    logger.warn(`No goog.module statement detected.`);
    return undefined;
  }

  // Create the goog.declareModuleId statement.
  const moduleName = path.value.arguments[0].value;
  const newModuleName = isDefault ? getTempModuleName(moduleName) : moduleName;
  if (moduleName) {
    const declareModuleExpr = jscs.expressionStatement(createCall('goog.declareModuleId', [jscs.literal(newModuleName)]));

    // Preserve comments at the top of the file.
    copyComments(path.parent.value, declareModuleExpr);

    // Replace the goog.module statement with goog.declareModuleId.
    jscs(path.parent).replaceWith(declareModuleExpr);
  } else {
    logger.warn(`No goog.module statement detected.`);
  }

  if (moduleCalls.length > 1) {
    logger.warn(`Multiple goog.module statements detected. Please verify the transformation result.`);
  }

  return moduleName;
};


/**
 * Sort goog.require statements.
 * @param {Node} root The root node.
 */
const sortRequires = root => {
  const requires = root.find(jscs.ExpressionStatement, isGoogRequire)
      .nodes()
      .map(node => node.expression.arguments[0].value)
      .sort();

  root.find(jscs.ExpressionStatement, isGoogRequire).forEach((path, idx, arr) => {
    const callee = jscs.memberExpression(jscs.identifier('goog'), jscs.identifier('require'));
    const call = jscs.callExpression(callee, [jscs.literal(requires[idx])]);
    jscs(path).replaceWith(jscs.expressionStatement(call));
  });
};


/**
 * Get the sort value for two goog.require/goog.requireType variable declarations.
 * @param {Node} a The first node.
 * @param {Node} b The second node.
 * @return {number} The sort value. Sorts goog.require above goog.requireType, then by required namespace.
 */
const sortModuleRequires_ = (a, b) => {
  const aIsRequire = a.declarations[0].init.callee.property.name === 'require';
  const bIsRequire = b.declarations[0].init.callee.property.name === 'require';

  if (aIsRequire === bIsRequire) {
    const aNamespace = a.declarations[0].init.arguments[0];
    const bNamespace = b.declarations[0].init.arguments[0];
    return aNamespace > bNamespace ? -1 : aNamespace < bNamespace ? 1 : 0
  }

  return aIsRequire ? -1 : 1;
};


/**
 * Sort goog.require variable declarations.
 * @param {Node} root The root node.
 */
const sortModuleRequires = root => {
  const requires = root.find(jscs.VariableDeclaration,
      (node) => isGoogModuleRequire(node) || isGoogModuleRequireType(node));
  if (requires.length) {
    const requireNodes = requires.nodes().slice().sort(sortModuleRequires_);
    requires.forEach((path, idx, arr) => {
      jscs(path).replaceWith(requireNodes[idx]);
    });
  }
};


module.exports = {
  addExports,
  addRequire,
  getGoogModuleExports,
  isGoogDeclareLegacyNamespace,
  isGoogDefine,
  isGoogModule,
  isGoogProvide,
  isGoogRequire,
  isGoogModuleRequire,
  isGoogModuleRequireType,
  isClosureClass,
  isControllerClass,
  isDirective,
  isInterface,
  isConst,
  isPrivate,
  removeLegacyNamespace,
  replaceLegacyRequire,
  getTempModuleName,
  isDefaultExport,
  replaceModuleExportsWithEs6,
  replaceModuleWithDeclareModuleId,
  sortRequires,
  sortModuleRequires
};
