const requiredMethods = ['hash', 'compare'];
const cryptoServiceContract = {
  validate(instance) {
    for (const method of requiredMethods) {
      if (typeof instance[method] !== 'function') {
        throw new TypeError(`CryptoService adapter must implement '${method}()'`);
      }
    }
  },
};

/**
 * Port: CryptoService
 *
 * Driven port — used by the application layer to hash and compare sensitive values
 * (e.g. passwords). Any adapter bound to CRYPTO_SERVICE_PORT must satisfy this interface.
 *
 * @typedef {Object} CryptoServicePort
 * @property {(plainText: string) => Promise<string>}               hash     - Hashes a plain-text value.
 * @property {(plain: string, hashed: string) => Promise<boolean>}  compare  - Compares a plain-text value against its hash.
 */

module.exports = { cryptoServiceContract };
