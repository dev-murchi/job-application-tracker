const { HttpStatusCodes } = require('../constants');
const CustomAPIError = require('./custom-api');

class BadRequestError extends CustomAPIError {
  constructor(message) {
    super(message);
    this.statusCode = HttpStatusCodes.BAD_REQUEST;
  }
}

module.exports = BadRequestError;
