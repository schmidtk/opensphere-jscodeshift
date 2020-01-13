const fs = require('fs');
const jscs = require('jscodeshift');
const {createCall, createMemberExpression} = require('./jscs');
const {getDefaultSourceOptions} = require('./sourceoptions');
const {logger} = require('./logger');

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

  logger.warn(`Creating UI shim: ${shimPath}`);

  const shimSource = jscs(program).toSource(getDefaultSourceOptions());
  fs.writeFileSync(shimPath, `${shimSource}\n`, 'utf8');
};

module.exports = {
  createUIShim
};
