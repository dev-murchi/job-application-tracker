const requiredMethods = ['sign', 'verify'];
const tokenServiceContract = {
  validate(instance) {
    for (const method of requiredMethods) {
      if (typeof instance[method] !== 'function') {
        throw new TypeError(`TokenService adapter must implement '${method}()'`);
      }
    }
  },
};

/**
 * Port: TokenService
 *
 * Driven port — used by the application layer to issue and verify authentication tokens.
 * Any adapter bound to TOKEN_SERVICE_PORT must satisfy this interface.
 *
 * @typedef {Object} TokenServicePort
 * @property {(payload: Object) => string}   sign    - Signs a payload and returns a JWT string.
 * @property {(token: string) => Object}     verify  - Verifies a JWT and returns the decoded payload.
 */

module.exports = { tokenServiceContract };
