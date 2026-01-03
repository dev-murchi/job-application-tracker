const { z } = require('zod');

/**
 * Calculate Shannon entropy of a string
 * Used to measure the randomness/unpredictability of JWT secrets
 * @param {string} str - String to analyze
 * @returns {number} Entropy value
 */
const calculateShannonEntropy = (str) => {
  const len = str.length;
  const frequencies = {};

  // Count character frequencies
  for (let i = 0; i < len; i++) {
    const char = str[i];
    frequencies[char] = (frequencies[char] || 0) + 1;
  }

  // Calculate Shannon entropy
  let entropy = 0;
  for (const char in frequencies) {
    const probability = frequencies[char] / len;
    entropy -= probability * Math.log2(probability);
  }

  return entropy;
};

/**
 * Load and validate configuration
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @param {object} rawConfig - Raw configuration object from environment
 * @returns {object} Validated configuration object
 * @throws {Error} Exits process if validation fails
 */
const loadAndValidate = (schema, rawConfig) => {
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

      console.error(`\nConfiguration validation failed:\n${errorMessages}\n`);
    }
    process.exit(1);
  }
};

module.exports = {
  loadAndValidate,
  calculateShannonEntropy,
};
