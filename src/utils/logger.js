const winston = require('winston');

const console = new winston.transports.Console();
let currentFile = '';
let lineRange = '';

const myFormat = winston.format.printf(info => {
  if (currentFile) {
    const lineRangeOutput = lineRange ? `${lineRange + ':'}` : '';
    return `[${info.level}] In ${currentFile}:${lineRangeOutput}\n  > ${info.message}`;
  }
  return `[${info.level}] ${info.message}`;
});

const logFormat = winston.format.combine(
  winston.format.colorize(),
  myFormat
);

const logger = winston.createLogger({
  format: logFormat,
  transports: [console]
});

/**
 * Abbreviate a file path for log output.
 * @param {string} path The file path.
 * @return {string} The abbreviated path.
 */
const abbreviatePath = (path) => path.replace(/(\.\.\/)+/, '').replace(/.*\/workspace\//, '');

/**
 * Set the current file being processed.
 * @param {string} file The file path.
 */
logger.setCurrentFile = (file) => {
  currentFile = abbreviatePath(file);
};


/**
 * Get the line number range for a node.
 * @param {Node} node The node.
 * @return {string} The line number range.
 */
const getLineRange = (node) => {
  if (node.loc) {
    const start = node.loc.start ? node.loc.start.line : -1;
    const end = node.loc.end ? node.loc.end.line : -1;
    if (start > -1) {
      let result = `${start}`;
      if (end > start) {
        result += `-${end}`;
      }
      return result;
    }
  }

  return '';
};

const logWithNode = (level, message, node) => {
  lineRange = getLineRange(node);
  logger.log(level, message);
  lineRange = '';
};

module.exports = {
  console,
  logger,
  logWithNode
};
