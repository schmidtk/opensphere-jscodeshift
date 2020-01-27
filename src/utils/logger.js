const winston = require('winston');

const console = new winston.transports.Console();
let currentFile = '';

const myFormat = winston.format.printf(info => {
  if (currentFile) {
    return `[${info.level}] In ${currentFile}:\n  > ${info.message}`;
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

module.exports = {
  console,
  logger
};
