const jwt = require('jsonwebtoken');

/**
 * Factory function to create JWT service
 * @param {Object} options - JWT configuration options
 * @param {string} options.secret - JWT secret key
 * @param {string} options.expiresIn - Token expiration time
 * @returns {Object} JWT service with sign and verify methods
 */
const createJwtService = ({ secret, expiresIn }) => {
  return {
    /**
     * Create a signed JWT token
     * @param {Object} payload - Token payload (e.g., { userId })
     * @returns {string} Signed JWT token
     */
    sign(payload) {
      return jwt.sign(payload, secret, { expiresIn });
    },

    /**
     * Verify and decode a JWT token
     * @param {string} token - JWT token to verify
     * @returns {Object} Decoded token payload
     * @throws {Error} If token is invalid or expired
     */
    verify(token) {
      return jwt.verify(token, secret);
    },
  };
};

module.exports = { createJwtService };
