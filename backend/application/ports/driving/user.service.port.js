const requiredMethods = ['updateUserProfile', 'getUserById'];
const userServiceContract = {
  validate(instance) {
    for (const method of requiredMethods) {
      if (typeof instance[method] !== 'function') {
        throw new TypeError(`UserService adapter must implement '${method}()'`);
      }
    }
  },
};

/**@typedef {import("../../../shared/dtos/user.dto").UpdateProfileInput} UpdateProfileInput */
/**@typedef {import("../../../shared/dtos/user.dto").UserDTO} UserDTO */

/**
 * Port: UserService
 *
 * Driving port — called by the HTTP layer to manage user profiles.
 * Any adapter bound to USER_SERVICE_PORT must satisfy this interface.
 *
 * @typedef {Object} UserServicePort
 * @property {(userId: string, updates: UpdateProfileInput) => Promise<UserDTO>}  updateUserProfile
 * @property {(userId: string) => Promise<UserDTO>}                               getUserById
 */

module.exports = { userServiceContract };
