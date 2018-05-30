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

module.exports = {
  console: console,
  logger: logger
};
