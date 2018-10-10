const get = require('get-value');
const jscs = require('jscodeshift');

module.exports = path => jscs.unaryExpression('typeof', get(path, 'node.arguments.0'));
