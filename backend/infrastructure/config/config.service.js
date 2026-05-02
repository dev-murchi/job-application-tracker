const { validateConfigWithSchema } = require('./validators/config-schema.validator');

/** @typedef {import('../../application/ports/driven/config/config-service.port').ConfigServicePort} ConfigServicePort */

/**
 * Creates a new configuration service instance with an isolated state.
 * * @example
 * const configService = createConfigService();
 * configService.loadConfig(mySchema, process.env);
 * const port = configService.get('PORT');
 * @returns {ConfigServicePort & {
 *   loadConfig: (schema: object, rawConfig: Record<string, any>) => void
 * }}
 */
const createConfigService = () => {
  const store = new Map();

  return {
    get: (key) => store.get(key),

    getAll: () => Object.fromEntries(store),

    loadConfig: (schema, rawConfig) => {
      const validatedConfigs = validateConfigWithSchema(schema, rawConfig);

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
