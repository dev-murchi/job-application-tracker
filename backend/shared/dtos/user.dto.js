/**
 * User Data Transfer Object.
 *
 * Safe,
 * sanitized: data.sanitized user shape returned to API consumers.
 * Never includes the hashed password field.
 *
 * @typedef {Object} UserDTO
 * @property {string}  name
 * @property {string}  lastName
 * @property {string}  email
 * @property {string}  [location]
 */

/**
 * @typedef {Object} UpdateProfileInput
 * @property {string}  [name]
 * @property {string}  [lastName]
 * @property {string}  [email]
 * @property {string}  [location]
 */

/**
 * Creates a UserDTO from a user data object.
 *
 * @param {Object} user - The raw user data object, typically from the database.
 * @returns {UserDTO} The formatted User Data Transfer Object.
 */
const crateUserDTO = (user) => ({
  email: user.email,
  lastName: user.lastName,
  location: user.location,
  name: user.name,
});

/**
 *
 * @param {*} data
 * @returns {UpdateProfileInput}
 */
const createUserProfileInputDTO = (data) => ({
  name: data.name,
  email: data.email,
  location: data.location,
  lastName: data.lastName,
});

module.exports = { crateUserDTO, createUserProfileInputDTO };
