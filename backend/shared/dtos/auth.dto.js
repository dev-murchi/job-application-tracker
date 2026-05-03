/**
 * @typedef {Object} RegisterUserInputDTO
 * @property {string}  name
 * @property {string}  lastName
 * @property {string}  email
 * @property {string}  password
 * @property {string}  [location]
 */

/**
 * @typedef {Object} AuthCredentials
 * @property {string}  email
 * @property {string}  password
 */

/**
 * @typedef {Object} AuthResult
 * @property {UserDTO}  user
 * @property {string}   token  - Signed JWT
 */

/**
 * Creates a RegisterUserInputDTO from raw input data.
 * @param {Object} data - Raw input, typically from a validated request body.
 * @param {string} data.name
 * @param {string} data.lastName
 * @param {string} data.email
 * @param {string} data.password
 * @param {string} [data.location]
 * @returns {RegisterUserInputDTO}
 */
const createRegisterUserInputDTO = (data) => {
  return {
    name: data.name,
    lastName: data.lastName,
    email: data.email,
    password: data.password,
    location: data.location,
  };
};

module.exports = {
  createRegisterUserInputDTO,
};
