const jscs = require('jscodeshift');
const {createFindMemberExprObject, replaceFunctionExpressionWithArrow} = require('./jscs');

const googBindAfterReplace = (path) => {
  if (path.value.arguments.length === 1) {
    jscs(path).replaceWith(path.value.arguments[0]);
  }
};

/**
 * Code patterns to replace.
 *  - type: The AST node type, passed to jscodeshift's find.
 *  - filter: Node filter to provide to jscodeshift's find.
 *  - fnArgs: Array of argument indices in the matched node that may have a function to replace.
 *  - thisArg: Index of the "this" context argument in the matched node.
 *  - afterReplace: Function to call after replacing the matched node. Only executed if all functions in fnArgs were
 *                  replaced.
 *
 * @type {Array}
 */
const PATTERNS = [
  {
    type: jscs.NewExpression,
    filter: {callee: createFindMemberExprObject('goog.Promise')},
    fnArgs: [0],
    thisArg: 1
  },
  {
    type: jscs.CallExpression,
    filter: {callee: createFindMemberExprObject('goog.events.listenOnce')},
    fnArgs: [2]
  },
  {
    type: jscs.CallExpression,
    filter: {callee: createFindMemberExprObject('goog.array.map')},
    fnArgs: [1],
    thisArg: 2
  },
  {
    type: jscs.CallExpression,
    filter: {callee: createFindMemberExprObject('goog.object.forEach')},
    fnArgs: [1],
    thisArg: 2
  },
  {
    type: jscs.CallExpression,
    filter: {callee: createFindMemberExprObject('goog.array.forEach')},
    fnArgs: [1],
    thisArg: 2
  },
  {
    type: jscs.CallExpression,
    filter: {callee: createFindMemberExprObject('goog.array.removeIf')},
    fnArgs: [1],
    thisArg: 2
  },
  {
    type: jscs.CallExpression,
    filter: {callee: createFindMemberExprObject('goog.events.listen')},
    fnArgs: [2],
    thisArg: 4
  },
  {
    type: jscs.CallExpression,
    filter: {callee: createFindMemberExprObject('goog.events.listenOnce')},
    fnArgs: [2],
    thisArg: 4
  },
  {
    type: jscs.CallExpression,
    filter: {callee: createFindMemberExprObject('goog.bind')},
    fnArgs: [0],
    thisArg: 1,
    afterReplace: googBindAfterReplace
  },
  {
    type: jscs.CallExpression,
    filter: {callee: createFindMemberExprObject('ol.events.listen')},
    fnArgs: [2],
    thisArg: 3
  },
  {
    type: jscs.CallExpression,
    filter: {callee: createFindMemberExprObject('ol.events.listenOnce')},
    fnArgs: [2],
    thisArg: 3
  },
  {
    type: jscs.CallExpression,
    filter: {callee: createFindMemberExprObject('addCallbacks')},
    fnArgs: [0, 1],
    thisArg: 2
  },
  {
    type: jscs.CallExpression,
    filter: {callee: createFindMemberExprObject('then')},
    fnArgs: [0, 1],
    thisArg: 2
  },
  {
    type: jscs.CallExpression,
    filter: {
      callee: createFindMemberExprObject('listen'),
      // using specific arguments to avoid false positives on calls to listen()
      arguments: [{}, {type: 'FunctionExpression'}, {type: 'Literal'}, {type: 'ThisExpression'}]
    },
    fnArgs: [1],
    thisArg: 3
  }
];

const resolveThis = (root) => {
  let totalReplaceCount = 0;

  PATTERNS.forEach(pattern => {
    root.find(pattern.type, pattern.filter).forEach((path) => {
      const fnArgs = pattern.fnArgs || [];
      let patternReplaceCount = 0;

      // arrow expressions will always be bound to the current "this" context, so verify the context argument is
      // explicitly provided as "this" before converting to an arrow
      if (pattern.thisArg == null || !path.value.arguments[pattern.thisArg] ||
          path.value.arguments[pattern.thisArg].type != 'ThisExpression') {
        return;
      }

      fnArgs.forEach(idx => {
        const argNode = path.value.arguments[idx];

        // replace inline function expressions with an arrow expression
        if (argNode.type === 'FunctionExpression') {
          const arrowFn = replaceFunctionExpressionWithArrow(argNode);
          if (arrowFn) {
            path.value.arguments[idx] = arrowFn;
            patternReplaceCount++;
            totalReplaceCount++;
          }
        }
      });

      // if all configured function expressions were replaced with an arrow function, remove/replace the "this" argument
      if (pattern.thisArg != null && patternReplaceCount === fnArgs.length) {
        // remove if it's the last argument, otherwise replace with "undefined"
        if (pattern.thisArg <= path.value.arguments.length - 1) {
          if (pattern.thisArg === path.value.arguments.length - 1) {
            path.value.arguments.pop();
          } else {
            path.value.arguments[pattern.thisArg] = jscs.identifier('undefined');
          }
        }

        if (pattern.afterReplace) {
          pattern.afterReplace(path);
        }
      }
    });
  });

  return totalReplaceCount;
};

module.exports = {resolveThis};
