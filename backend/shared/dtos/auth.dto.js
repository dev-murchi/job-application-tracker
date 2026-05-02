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
 *
 * @param {*} data
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
