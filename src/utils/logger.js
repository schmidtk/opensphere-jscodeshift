const winston = require('winston');

const console = new winston.transports.Console();

const myFormat = winston.format.printf(info => {
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

module.exports = {
  abbreviatePath,
  console,
  logger
};
