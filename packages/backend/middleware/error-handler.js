const { StatusCodes } = require('http-status-codes');
const config = require('../config');
const logger = require('../utils/logger');

const errorHandlerMiddleware = (err, req, res, next) => {
  // Log the full error for debugging (includes stack trace)
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.userId || 'anonymous'
  });

  let customError = {
    // Set default values
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    msg: err.message || 'Something went wrong, please try again later',
  };

  // Validation errors
  if (err.name === 'ValidationError') {
    customError.msg = Object.values(err.errors)
      .map((item) => item.message)
      .join(', ');
    customError.statusCode = StatusCodes.BAD_REQUEST;
  }

  // Duplicate key error (MongoDB)
  else if (err.code && err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    customError.msg = `${field} already exists. Please choose another value.`;
    customError.statusCode = StatusCodes.BAD_REQUEST;
  }

  // Cast error (invalid MongoDB ObjectId)
  else if (err.name === 'CastError') {
    customError.msg = `No resource found with id: ${err.value}`;
    customError.statusCode = StatusCodes.NOT_FOUND;
  }

  // JWT errors
  else if (err.name === 'JsonWebTokenError') {
    customError.msg = 'Invalid token. Please log in again.';
    customError.statusCode = StatusCodes.UNAUTHORIZED;
  }

  else if (err.name === 'TokenExpiredError') {
    customError.msg = 'Token expired. Please log in again.';
    customError.statusCode = StatusCodes.UNAUTHORIZED;
  }

  // Zod validation errors
  else if (err.name === 'ZodError') {
    const errorMessages = err.errors.map((error) => {
      const field = error.path.join('.');
      return `${field}: ${error.message}`;
    });
    customError.msg = errorMessages.join(', ');
    customError.statusCode = StatusCodes.BAD_REQUEST;
  }

  // Sanitize error response for production
  const response = {
    success: false,
    message: customError.msg,
    statusCode: customError.statusCode,
  };

  // For production, provide generic error messages for 5xx errors
  if (config.isProduction && customError.statusCode >= 500) {
    response.message = 'Internal server error. Please try again later.';
  }

  return res.status(customError.statusCode).json(response);
};

module.exports = errorHandlerMiddleware;