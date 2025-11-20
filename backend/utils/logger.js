const { createLogger, format, transports } = require('winston');
const config = require('../config');

const logLevel = config.logLevel || (config.isProduction ? 'info' : 'debug');

const customFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.printf(({ timestamp, level, message, stack }) => {
    const msg = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    return stack ? `${msg}\n${stack}` : msg;
  }),
);

const logger = createLogger({
  level: logLevel,
  format: customFormat,
  transports: [
    new transports.Console({
      format: format.combine(format.colorize(), customFormat),
    }),
  ],
  // Don't exit on uncaught exception
  exitOnError: false,
});

// Create a stream for Morgan
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

module.exports = logger;
