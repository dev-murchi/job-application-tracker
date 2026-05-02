const requiredMethods = ['get', 'getAll'];

const configServiceContract = {
  validate(instance) {
    for (const method of requiredMethods) {
      if (typeof instance[method] !== 'function') {
        throw new TypeError(`ConfigReader adapter must implement '${method}()'`);
      }
    }
  },
};

/**
 * Port: ConfigReader
 *
 * Driven port used by application, infrastructure, and presentation layers
 * to read validated runtime configuration values.
 *
 * @typedef {Object} ConfigServicePort
 * @property {(key: string) => any} get - Return a single config value by key.
 * @property {() => Record<string, any>} getAll - Return a snapshot of all config values.
 */

module.exports = { configServiceContract };
