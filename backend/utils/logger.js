const { createLogger, format, transports } = require('winston');

/**
 * Create a Winston logger service with custom formatting
 * @param {Object} options - Logger configuration options
 * @param {string} [options.logLevel] - Log level (error, warn, info, http, debug)
 * @param {boolean} [options.isProduction] - Whether running in production mode
 * @returns {Object} Configured Logger instance with stream property for Morgan
 */
const createLoggerService = (options) => {
  const logLevel = options.logLevel || (options.isProduction ? 'info' : 'debug');

  const customFormat = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.printf(({ timestamp, level, message, stack }) => {
      const msg = `[${timestamp}] ${level}: ${message}`;
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

  return logger;
};

module.exports = { createLoggerService };
