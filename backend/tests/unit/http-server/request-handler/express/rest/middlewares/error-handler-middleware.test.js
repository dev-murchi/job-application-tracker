const {
  createErrorHandler,
} = require('../../../../../../../adapters/presentations/http-server/request-handler/express/rest/middlewares');
const { HttpStatusCodes } = require('../../../../../../../shared/constants');

// Mock configService factory
const createMockConfigService = (isProduction = false) => ({
  get: jest.fn().mockImplementation((key) => {
    if (key === 'isProduction') {
      return isProduction;
    }
    return null;
  }),
});

describe('Error Handler Middleware', () => {
  let req, res, next, errorHandler, mockConfigService;

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
    mockConfigService = createMockConfigService(false);
    errorHandler = createErrorHandler({ configService: mockConfigService });
  });

  it('should handle generic errors with default status code', () => {
    const error = new Error('Something went wrong');

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(HttpStatusCodes.INTERNAL_SERVER_ERROR);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Something went wrong',
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
    });
  });

  it('should handle errors with custom status code', () => {
    const error = new Error('Bad request');
    error.statusCode = HttpStatusCodes.BAD_REQUEST;

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(HttpStatusCodes.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Bad request',
      statusCode: HttpStatusCodes.BAD_REQUEST,
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

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(HttpStatusCodes.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Name is required, Email is invalid',
      statusCode: HttpStatusCodes.BAD_REQUEST,
    });
  });

  it('should handle duplicate key error (code 11000)', () => {
    const error = {
      code: 11000,
      keyValue: { email: 'test@test.com' },
    };

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(HttpStatusCodes.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'email already exists. Please choose another value.',
      statusCode: HttpStatusCodes.BAD_REQUEST,
    });
  });

  it('should handle CastError (invalid MongoDB ObjectId)', () => {
    const error = {
      name: 'CastError',
      value: 'invalid-id-123',
    };

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(HttpStatusCodes.NOT_FOUND);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'No resource found with id: invalid-id-123',
      statusCode: HttpStatusCodes.NOT_FOUND,
    });
  });

  it('should handle JsonWebTokenError', () => {
    const error = {
      name: 'JsonWebTokenError',
      message: 'jwt malformed',
    };

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(HttpStatusCodes.UNAUTHORIZED);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid token. Please provide valid token.',
      statusCode: HttpStatusCodes.UNAUTHORIZED,
    });
  });

  it('should handle TokenExpiredError', () => {
    const error = {
      name: 'TokenExpiredError',
      message: 'jwt expired',
    };

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(HttpStatusCodes.UNAUTHORIZED);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Token expired. Please provide valid token.',
      statusCode: HttpStatusCodes.UNAUTHORIZED,
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

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(HttpStatusCodes.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'name: Required, email: Invalid email',
      statusCode: HttpStatusCodes.BAD_REQUEST,
    });
  });

  it('should handle errors when user is not authenticated', () => {
    delete req.user;
    const error = new Error('Test error');

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(HttpStatusCodes.INTERNAL_SERVER_ERROR);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Test error',
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
    });
  });

  it('should provide generic message for 5xx errors in production', () => {
    const prodConfigService = createMockConfigService(true);
    const prodErrorHandler = createErrorHandler({ configService: prodConfigService });
    const error = new Error('Database connection failed');
    error.statusCode = HttpStatusCodes.INTERNAL_SERVER_ERROR;

    prodErrorHandler(error, req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Internal server error. Please try again later.',
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
    });
  });

  it('should not mask client errors (4xx) in production', () => {
    const prodConfigService = createMockConfigService(true);
    const prodErrorHandler = createErrorHandler({ configService: prodConfigService });
    const error = new Error('Invalid input');
    error.statusCode = HttpStatusCodes.BAD_REQUEST;

    prodErrorHandler(error, req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid input',
      statusCode: HttpStatusCodes.BAD_REQUEST,
    });
  });

  it('should handle errors with stack traces', () => {
    const error = new Error('Test error');
    error.stack = 'Error: Test error\n    at Object.<anonymous>';

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(HttpStatusCodes.INTERNAL_SERVER_ERROR);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Test error',
      statusCode: HttpStatusCodes.INTERNAL_SERVER_ERROR,
    });
  });
});
