const errorHandlerMiddleware = require('../../middleware/error-handler');
const logger = require('../../utils/logger');
const config = require('../../config');
const { StatusCodes } = require('http-status-codes');

jest.mock('../../config');

describe('Error Handler Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      url: '/test',
      method: 'GET',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Test User Agent'),
      user: { userId: 'user123' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
    config.isProduction = false;
  });

  it('should handle generic errors with default status code', () => {
    const error = new Error('Something went wrong');

    errorHandlerMiddleware(error, req, res, next);

    expect(logger.error).toHaveBeenCalledWith(
      'Error occurred:',
      expect.objectContaining({
        message: 'Something went wrong',
        url: '/test',
        userId: 'user123',
      }),
    );
    expect(res.status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Something went wrong',
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  });

  it('should handle errors with custom status code', () => {
    const error = new Error('Bad request');
    error.statusCode = StatusCodes.BAD_REQUEST;

    errorHandlerMiddleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Bad request',
      statusCode: StatusCodes.BAD_REQUEST,
    });
  });

  it('should handle ValidationError from Mongoose', () => {
    const error = {
      name: 'ValidationError',
      errors: {
        name: { message: 'Name is required' },
        email: { message: 'Email is invalid' },
      },
    };

    errorHandlerMiddleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Name is required, Email is invalid',
      statusCode: StatusCodes.BAD_REQUEST,
    });
  });

  it('should handle duplicate key error (code 11000)', () => {
    const error = {
      code: 11000,
      keyValue: { email: 'test@test.com' },
    };

    errorHandlerMiddleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'email already exists. Please choose another value.',
      statusCode: StatusCodes.BAD_REQUEST,
    });
  });

  it('should handle CastError (invalid MongoDB ObjectId)', () => {
    const error = {
      name: 'CastError',
      value: 'invalid-id-123',
    };

    errorHandlerMiddleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'No resource found with id: invalid-id-123',
      statusCode: StatusCodes.NOT_FOUND,
    });
  });

  it('should handle JsonWebTokenError', () => {
    const error = {
      name: 'JsonWebTokenError',
      message: 'jwt malformed',
    };

    errorHandlerMiddleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid token. Please provide valid token.',
      statusCode: StatusCodes.UNAUTHORIZED,
    });
  });

  it('should handle TokenExpiredError', () => {
    const error = {
      name: 'TokenExpiredError',
      message: 'jwt expired',
    };

    errorHandlerMiddleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Token expired. Please provide valid token.',
      statusCode: StatusCodes.UNAUTHORIZED,
    });
  });

  it('should handle ZodError validation errors', () => {
    const error = {
      name: 'ZodError',
      issues: [
        { path: ['name'], message: 'Required' },
        { path: ['email'], message: 'Invalid email' },
      ],
    };

    errorHandlerMiddleware(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'name: Required, email: Invalid email',
      statusCode: StatusCodes.BAD_REQUEST,
    });
  });

  it('should log anonymous user when user is not authenticated', () => {
    delete req.user;
    const error = new Error('Test error');

    errorHandlerMiddleware(error, req, res, next);

    expect(logger.error).toHaveBeenCalledWith(
      'Error occurred:',
      expect.objectContaining({
        userId: 'anonymous',
      }),
    );
  });

  it('should provide generic message for 5xx errors in production', () => {
    config.isProduction = true;
    const error = new Error('Database connection failed');
    error.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;

    errorHandlerMiddleware(error, req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Internal server error. Please try again later.',
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  });

  it('should not mask client errors (4xx) in production', () => {
    config.isProduction = true;
    const error = new Error('Invalid input');
    error.statusCode = StatusCodes.BAD_REQUEST;

    errorHandlerMiddleware(error, req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid input',
      statusCode: StatusCodes.BAD_REQUEST,
    });
  });

  it('should log error stack trace', () => {
    const error = new Error('Test error');
    error.stack = 'Error: Test error\n    at Object.<anonymous>';

    errorHandlerMiddleware(error, req, res, next);

    expect(logger.error).toHaveBeenCalledWith(
      'Error occurred:',
      expect.objectContaining({
        stack: expect.stringContaining('Error: Test error'),
      }),
    );
  });
});
