const requiredMethods = ['registerUser', 'authenticateUser'];
const authServiceContract = {
  validate(instance) {
    for (const method of requiredMethods) {
      if (typeof instance[method] !== 'function') {
        throw new TypeError(`AuthService adapter must implement '${method}()'`);
      }
    }
  },
};

/** @typedef {import("../../../shared/dtos/auth.dto").RegisterUserInputDTO} RegisterUserInputDTO */
/** @typedef {import("../../../shared/dtos/auth.dto").AuthCredentials} AuthCredentials */
/** @typedef {import("../../../shared/dtos/auth.dto").AuthResult} AuthResult */
/** @typedef {import("../../../shared/dtos/user.dto").UserDTO} UserDTO */

/**
 * Port: AuthService
 *
 * Driving port — called by the HTTP layer to handle authentication flows.
 * Any adapter bound to AUTH_SERVICE_PORT must satisfy this interface.
 *
 * @typedef {Object} AuthServicePort
 * @property {(userData: RegisterUserInputDTO) => Promise<UserDTO>}       registerUser
 * @property {(credentials: AuthCredentials) => Promise<AuthResult>}      authenticateUser
 */

module.exports = { authServiceContract };
