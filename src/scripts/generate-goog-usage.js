/* eslint-disable no-console */

const fs = require('fs');
const jscs = require('jscodeshift');
const sourceOptions = require('../utils/sourceoptions');

/**
 * Find all `goog.*` expressions in a file.
 * @param {File} file The file being processed.
 * @param {Object} api The jscodeshift API.
 * @param {Object} options The jscodeshift options.
 */
module.exports = (file, api, options) => {
  const root = jscs(file.source);

  const expressions = [];

  root.find(jscs.MemberExpression, {
    object: {name: 'goog'}
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

    if (path) {
      delete path.value.comments;
      delete path.value.leadingComments;

      const srcStr = jscs(path).toSource(sourceOptions);
      if (srcStr.indexOf('/**') !== -1) {
        console.log(file.path);
      } else {
        expressions.push(srcStr);
      }
    }
  });

  if (expressions.length) {
    fs.appendFile('./.build/goog-usage', `${expressions.join('\n')}\n`, function(err) {
      if (err) {
        return console.log(err);
      }
    });
  }

  return root.toSource(sourceOptions);
};
