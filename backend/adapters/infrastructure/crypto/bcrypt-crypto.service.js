const bcrypt = require('bcryptjs');
const { BCRYPT_SALT_ROUNDS } = require('../../../shared/constants');

/**@typedef {import('../../../application/ports/driven/crypto/crypto.service.port').CryptoServicePort} CryptoServicePort */

/**
 * Factory function to create the bcrypt-backed crypto service.
 * @returns {CryptoServicePort} Crypto service methods
 */
const createBcryptCryptoService = () => {
  return {
    hash: async (plainText) => {
      const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
      return await bcrypt.hash(plainText, salt);
    },
    compare: async (plain, hashed) => {
      const isMatch = await bcrypt.compare(plain, hashed);
      return isMatch;
    },
  };
};

module.exports = { createBcryptCryptoService };
