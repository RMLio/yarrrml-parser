const winston = require('winston');

module.exports = winston.createLogger({
  level: 'info',
  format: winston.format.cli(),
  // consoleWarnLevels: ['error', 'warn', 'info'],
  stderrLevels: ['error', 'warn', 'info'],
  transports: [
    new winston.transports.Console(),
  ]
});