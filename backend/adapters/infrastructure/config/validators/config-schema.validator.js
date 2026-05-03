const { z } = require('zod');

/**
 * Validate a raw configuration object against a Zod schema.
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @param {object} rawConfig - Raw configuration object from environment
 * @returns {object} Validated and parsed configuration object
 * @throws {Error} If validation fails (wraps ZodError with a human-readable message)
 */
const validateConfigWithSchema = (schema, rawConfig) => {
  try {
    return schema.parse(rawConfig);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues
        .map((err) => {
          let message = `${err.path.join('.')}: ${err.message}`;

          // Add helpful suggestion for JWT secret errors
          if (err.path.includes('jwtSecret')) {
            message +=
              '\n\nTo generate a secure JWT secret, run:\n' +
              "node -e \"console.log(require('crypto').randomBytes(64).toString('base64'))\"";
          }

          return message;
        })
        .join('\n');

      const configError = new Error(`Configuration validation failed:\n${errorMessages}`);
      configError.cause = error; // Preserve original ZodError
      throw configError;
    }

    throw error;
  }
};

module.exports = {
  validateConfigWithSchema,
};
