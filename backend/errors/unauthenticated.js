const { HttpStatusCodes } = require('../constants');
const CustomAPIError = require('./custom-api');

class UnauthenticatedError extends CustomAPIError {
  constructor(message) {
    super(message);
    this.statusCode = HttpStatusCodes.UNAUTHORIZED;
  }
}

module.exports = UnauthenticatedError;
