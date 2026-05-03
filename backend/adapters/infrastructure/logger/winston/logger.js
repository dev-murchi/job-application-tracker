/**@typedef {import('../../../../application/ports/driven/config/config-service.port').ConfigServicePort} ConfigServicePort*/
/**@typedef {import('../../../../application/ports/driven/logger/logger.service.port').LoggerServicePort} LoggerServicePort*/

const { createLogger, format, transports } = require('winston');

/**
 * Create a Winston logger service with custom formatting.
 *
 * @param {{ configService: ConfigServicePort}} deps
 * @returns {LoggerServicePort} Configured logger instance
 */
const createLoggerService = ({ configService }) => {
  const isProduction = configService.get('isProduction');
  const logLevel = configService.get('logLevel') || (isProduction ? 'info' : 'debug');

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

  const { info, warn, error, debug } = logger;

  return { info, warn, error, debug };
};

module.exports = { createLoggerService };
