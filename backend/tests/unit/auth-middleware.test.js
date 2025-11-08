const jwt = require('jsonwebtoken');
const authenticateUser = require('../../middleware/auth');
const { UnauthenticatedError } = require('../../errors');
const config = require('../../config');
const dbService = require('../../db/db-service');

jest.mock('jsonwebtoken');
jest.mock('../../db/db-service');

// Mock User model
const User = {
  findOne: jest.fn(),
};

// Setup dbService mock to return our mocked User model
dbService.getModel = jest.fn().mockImplementation((modelName) => {
  if (modelName === 'User') {
    return User;
  }
  return null;
});

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      cookies: {},
    };
    res = {};
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should authenticate user with valid token', async () => {
    const token = 'valid-token';
    const payload = { userId: '507f1f77bcf86cd799439011', name: 'John Doe' };
    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
    };

    req.cookies.token = token;
    jwt.verify.mockReturnValue(payload);
    User.findOne.mockReturnValue({
      lean: jest.fn().mockResolvedValue(mockUser),
    });

    await authenticateUser(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith(token, config.jwtSecret);
    expect(User.findOne).toHaveBeenCalledWith({ _id: payload.userId });
    expect(req.user).toEqual({
      _id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      userId: '507f1f77bcf86cd799439011',
    });
    expect(next).toHaveBeenCalled();
  });

  it('should throw UnauthenticatedError when token is missing', async () => {
    req.cookies.token = undefined;

    await expect(authenticateUser(req, res, next)).rejects.toThrow(UnauthenticatedError);
    await expect(authenticateUser(req, res, next)).rejects.toThrow('Authentication Invalid');
    expect(next).not.toHaveBeenCalled();
  });

  it('should throw UnauthenticatedError when token is null', async () => {
    req.cookies.token = null;

    await expect(authenticateUser(req, res, next)).rejects.toThrow(UnauthenticatedError);
    expect(next).not.toHaveBeenCalled();
  });

  it('should throw UnauthenticatedError when token verification fails', async () => {
    req.cookies.token = 'invalid-token';
    jwt.verify.mockImplementation(() => {
      throw new Error('jwt malformed');
    });

    const expectedErr = new Error('jwt malformed');
    await expect(authenticateUser(req, res, next)).rejects.toThrow(expectedErr);
    expect(next).not.toHaveBeenCalled();
  });

  it('should throw UnauthenticatedError when token is expired', async () => {
    req.cookies.token = 'expired-token';
    jwt.verify.mockImplementation(() => {
      const error = new Error('jwt expired');
      error.name = 'TokenExpiredError';
      throw error;
    });

    const expectedErr = new Error('jwt expired');
    expectedErr.name = 'TokenExpiredError';

    await expect(authenticateUser(req, res, next)).rejects.toThrow(expectedErr);
    expect(next).not.toHaveBeenCalled();
  });

  it('should throw UnauthenticatedError for invalid signature', async () => {
    req.cookies.token = 'tampered-token';
    jwt.verify.mockImplementation(() => {
      const error = new Error('invalid signature');
      error.name = 'JsonWebTokenError';
      throw error;
    });

    const expectedErr = new Error('invalid signature');
    expectedErr.name = 'JsonWebTokenError';

    await expect(authenticateUser(req, res, next)).rejects.toThrow(expectedErr);
    expect(next).not.toHaveBeenCalled();
  });
});
