/**
 * Get the default options for Node.toSource.
 * @return {Object}
 */
const getDefaultSourceOptions = () => ({
  // match ESLint rules
  arrayBracketSpacing: false,
  arrowParensAlways: false,
  objectCurlySpacing: false,
  quote: 'single',
  trailingComma: false,

  // whitespace/formatting
  reuseWhitespace: true,
  tabWidth: 2,
  useTabs: false,
  wrapColumn: 120
});

module.exports = {getDefaultSourceOptions};
