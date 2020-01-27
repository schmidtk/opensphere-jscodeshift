const fs = require('fs');
const jscs = require('jscodeshift');

const {createFindMemberExprObject} = require('./ast');
const {createCall, createMemberExpression} = require('./jscs');
const {getDefaultSourceOptions} = require('./options');
const {logger} = require('./logger');


/**
 * Get a unique file name from a module name.
 * @param {string} moduleName The module name.
 * @param {string} basePath The base file path.
 * @return {string} The unique file name.
 */
const getUniqueFileNameForModule = (moduleName, basePath) => {
  const parts = moduleName.split('.');
  let baseFileName = `${parts.pop().toLowerCase()}`;
  let fileName = `${baseFileName}.js`;

  // first try prepending parts of the namespace
  while (fs.existsSync(`${basePath}/${fileName}`) && parts.length) {
    baseFileName = `${parts.pop().toLowerCase()}${baseFileName}`;
    fileName = `${baseFileName}.js`;
  }

  // if the name still exists, add a counter
  if (fs.existsSync(`${basePath}/${fileName}`)) {
    let i = 1;
    while (fs.existsSync(`${basePath}/${fileName}`)) {
      fileName = `${baseFileName}${i++}.js`;
    }
  }

  return fileName;
};


/**
 * Move a direct module assignment to its own file.
 * @param {NodePath} root The root node path for the original file.
 * @param {NodePath} path The assignment node path.
 * @param {string} moduleName The module name.
 * @param {string} basePath The base path for the file.
 * @param {boolean} writeFile If the file should be written.
 */
const createAssignmentShim = (root, path, moduleName, basePath, writeFile) => {
  if (writeFile) {
    // create a new program with goog.module statements for the module
    const program = jscs.program([]);
    program.body.push(jscs.expressionStatement(createCall('goog.module', [jscs.literal(moduleName)])));
    program.body.push(jscs.expressionStatement(createCall('goog.module.declareLegacyNamespace', [])));

    // add the assignment as the default export
    path.value.left = jscs.identifier('exports');
    const newExpr = jscs.expressionStatement(path.value);
    newExpr.comments = path.parent.value.comments.slice();
    program.body.push(newExpr);

    // generate a unique file name and write the file
    const fileName = getUniqueFileNameForModule(moduleName, basePath);
    const filePath = `${basePath}/${fileName}`;
    logger.info(`Creating new module: ${filePath}`);

    const fileSource = jscs(program).toSource(getDefaultSourceOptions());
    fs.writeFileSync(filePath, `${fileSource}\n`, 'utf8');
  }

  // remove the goog.module statement from the original file
  root.find(jscs.ExpressionStatement, {
    expression: {
      callee: createFindMemberExprObject('goog.module'),
      arguments: [{value: moduleName}]
    }
  }).remove();

  // remove the assignment from the original file
  jscs(path.parent).remove();
};


/**
 * Creates a shim file for an Angular UI.
 * @param {string} uiPath Path to the UI file.
 * @param {string} controllerName The original controller name.
 * @param {string} directiveName The original directive name.
 */
const createUIShim = (uiPath, controllerName, directiveName) => {
  const shimPath = uiPath.replace(/\.js/, '_shim.js');
  if (fs.existsSync(shimPath)) {
    return;
  }

  const moduleName = controllerName.replace(/Ctrl$/, '');
  const program = jscs.program([]);
  program.body.push(jscs.expressionStatement(createCall('goog.provide', [jscs.literal(controllerName)])));
  program.body.push(jscs.expressionStatement(createCall('goog.provide', [jscs.literal(directiveName)])));
  program.body.push(jscs.emptyStatement());
  program.body.push(jscs.expressionStatement(createCall('goog.require', [jscs.literal(moduleName)])));

  const ctrlAssignment = jscs.assignmentExpression('=',
      createMemberExpression(controllerName),
      createMemberExpression(`${moduleName}.Controller`));
  const ctrlComment = `*\n * @deprecated Please use goog.require('${moduleName}').Controller instead.\n `;
  ctrlAssignment.comments = [jscs.commentBlock(ctrlComment)];

  program.body.push(jscs.expressionStatement(ctrlAssignment));

  const dirAssignment = jscs.assignmentExpression('=',
      createMemberExpression(directiveName),
      createMemberExpression(`${moduleName}.directive`));
  const dirComment = `*\n * @deprecated Please use goog.require('${moduleName}').directive instead.\n `;
  dirAssignment.comments = [jscs.commentBlock(dirComment)];

  program.body.push(jscs.expressionStatement(dirAssignment));
  program.body.push(jscs.emptyStatement());

  logger.info(`Creating UI shim: ${shimPath}`);

  const shimSource = jscs(program).toSource(getDefaultSourceOptions());
  fs.writeFileSync(shimPath, `${shimSource}\n`, 'utf8');
};


module.exports = {
  createAssignmentShim,
  createUIShim
};
