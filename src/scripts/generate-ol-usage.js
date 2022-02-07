/* eslint-disable no-console */

const fs = require('fs');
const jscs = require('jscodeshift');
const {memberExpressionToString} = require('../utils/jscs');

/**
 * Find all `ol.*` expressions in a file.
 * @param {File} file The file being processed.
 * @param {Object} api The jscodeshift API.
 * @param {Object} options The jscodeshift options.
 */
module.exports = (file, api, options) => {
  // This file contains @typedef annotations on the global ol object. It should be an externs file, but OL made it a
  // src file so we're stuck with it for now. Ignore it for the sake of this script.
  if (file.path.endsWith('typedefs.js')) {
    return file.source;
  }

  const root = jscs(file.source);

  const expressions = [];

  root.find(jscs.MemberExpression, {
    object: {name: 'ol'}
  }).forEach(path => {
    let parent = path.parent;
    while (parent) {
      if (parent.value.type === 'MemberExpression' && parent.value.object.type === 'MemberExpression') {
        path = parent;
        parent = path.parent;
      } else {
        parent = undefined;
      }
    }

    if (path && path.value) {
      expressions.push(`${file.path}: ${memberExpressionToString(path.value)}`);
    }
  });

  if (expressions.length) {
    fs.appendFile('./.build/ol-usage', `${expressions.join('\n')}\n`, function(err) {
      if (err) {
        return console.log(err);
      }
    });
  }

  return file.source;
};
