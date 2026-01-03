const { loadAndValidate } = require('../utils/config-validation');

/**
 * @typedef {Object} ConfigService
 * @property {(key: string) => any} get
 * Retrieves a specific configuration value by its key.
 * @property {() => Record<string, any>} getAll
 * Returns a snapshot of all current configuration values as a plain object.
 * @property {(schema: object, rawConfig: Record<string, any>) => void} loadConfig
 * Validates a raw configuration object against a schema and merges it into the store.
 */

/**
 * Creates a new configuration service instance with an isolated state.
 * * @example
 * const configService = createConfigService();
 * configService.loadConfig(mySchema, process.env);
 * const port = configService.get('PORT');
 * * @returns {ConfigService} The configuration service API.
 */
const createConfigService = () => {
  const store = new Map();

  return {
    get: (key) => store.get(key),

    getAll: () => Object.fromEntries(store),

    loadConfig: (schema, rawConfig) => {
      const validatedConfigs = loadAndValidate(schema, rawConfig);

      for (const [key, value] of Object.entries(validatedConfigs)) {
        if (store.has(key)) {
          console.warn(`[ConfigService] Warning: Overwriting existing config key "${key}"`);
        }
        store.set(key, value);
      }
    },
  };
};

module.exports = {
  createConfigService,
};
