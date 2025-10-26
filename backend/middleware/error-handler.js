const { StatusCodes } = require('http-status-codes');
const config = require('../config');
const logger = require('../utils/logger');

const MONGO_DUPLICATE_KEY_ERROR_CODE = 11000;

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

const logError = (err, req) => {
  logger.error('Error occurred:', {
    message: err.message,
    issues: err.issues || [],
    stack: config.isProduction ? undefined : err.stack,
    url: req.url,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req.user && req.user.userId) || 'anonymous',
  });
};

const sanitizeErrorMessage = (message, statusCode) => {
  if (config.isProduction && statusCode >= StatusCodes.INTERNAL_SERVER_ERROR) {
    return 'Internal server error. Please try again later.';
  }
  return message;
};

const errorHandlerMiddleware = (err, req, res, _next) => {
  logError(err, req);

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
