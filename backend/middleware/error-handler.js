const { StatusCodes } = require('http-status-codes');
const config = require('../config');
const { MONGO_DUPLICATE_KEY_ERROR_CODE } = require('../constants');

const errorHandlers = {
  ValidationError: (err) => ({
    msg: Object.values(err.errors)
      .map((item) => item.message)
      .join(', '),
    statusCode: StatusCodes.BAD_REQUEST,
  }),

  CastError: (err) => ({
    msg: `No resource found with id: ${err.value}`,
    statusCode: StatusCodes.NOT_FOUND,
  }),

  JsonWebTokenError: () => ({
    msg: 'Invalid token. Please provide valid token.',
    statusCode: StatusCodes.UNAUTHORIZED,
  }),

  TokenExpiredError: () => ({
    msg: 'Token expired. Please provide valid token.',
    statusCode: StatusCodes.UNAUTHORIZED,
  }),

  ZodError: (err) => ({
    msg: err.issues
      .map((issue) => {
        const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
        return `${path}${issue.message}`;
      })
      .join(', '),
    statusCode: StatusCodes.BAD_REQUEST,
  }),
};

const handleMongoError = (err) => {
  if (err.code === MONGO_DUPLICATE_KEY_ERROR_CODE) {
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : 'Field';
    return {
      msg: `${field} already exists. Please choose another value.`,
      statusCode: StatusCodes.BAD_REQUEST,
    };
  }
  return null;
};

const sanitizeErrorMessage = (message, statusCode) => {
  if (config.isProduction && statusCode >= StatusCodes.INTERNAL_SERVER_ERROR) {
    return 'Internal server error. Please try again later.';
  }
  return message;
};

/**
 * Express error handling middleware
 * Handles various error types and returns standardized JSON responses
 * @param {Error} err - Error object
 * @param {express.Request} _req - Express request object (unused)
 * @param {express.Response} res - Express response object
 * @param {Function} _next - Express next function (unused)
 * @returns {express.Response} JSON error response
 */
const errorHandlerMiddleware = (err, _req, res, _next) => {
  // Try specific error handlers
  const handler = errorHandlers[err.name];
  const mongoError = handleMongoError(err);

  const customError = handler
    ? handler(err)
    : mongoError || {
        statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
        msg: err.message || 'Something went wrong, please try again later',
      };

  const response = {
    success: false,
    message: sanitizeErrorMessage(customError.msg, customError.statusCode),
    statusCode: customError.statusCode,
  };

  return res.status(customError.statusCode).json(response);
};

module.exports = errorHandlerMiddleware;
