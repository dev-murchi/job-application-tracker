const requiredMethods = ['info', 'warn', 'error', 'debug'];

const loggerServiceContract = {
  validate(instance) {
    for (const method of requiredMethods) {
      if (typeof instance[method] !== 'function') {
        throw new TypeError(`LoggerService adapter must implement '${method}()'`);
      }
    }
  },
};

/**
 * Port: LoggerService
 *
 * Driving port - used by application code to log messages
 * Any adapter bound to LOGGER_SERVICE_PORT must satisfy this interface
 *
 * @typedef {Object} LoggerServicePort
 * @property {(message: string, meta?: Record<string, any>) => void} info - Log informational messages
 * @property {(message: string, meta?: Record<string, any>) => void} warn - Log warning messages
 * @property {(message: string, meta?: Record<string, any>) => void} error - Log error messages
 * @property {(message: string, meta?: Record<string, any>) => void} debug - Log debug messages
 */

module.exports = { loggerServiceContract };
