const { createAuthenticationMiddleware } = require('../../middleware/auth');
const { UnauthenticatedError } = require('../../errors');

// Mock userRepository factory
const createMockUserRepository = () => ({
  findById: jest.fn(),
});

// Mock jwtService factory
const createMockJwtService = () => ({
  sign: jest.fn(),
  verify: jest.fn(),
});

describe('Auth Middleware', () => {
  let req, res, next, mockUserRepository, mockJwtService, authenticateUser, mockLogger;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    mockJwtService = createMockJwtService();
    mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    };
    const authMiddleware = createAuthenticationMiddleware({
      userRepository: mockUserRepository,
      jwtService: mockJwtService,
      loggerService: mockLogger,
    });
    authenticateUser = authMiddleware.authenticateUser;

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
    mockJwtService.verify.mockReturnValue(payload);
    mockUserRepository.findById.mockResolvedValue(mockUser);

    await authenticateUser(req, res, next);

    expect(mockJwtService.verify).toHaveBeenCalledWith(token);
    expect(mockUserRepository.findById).toHaveBeenCalledWith(payload.userId);
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
    mockJwtService.verify.mockImplementation(() => {
      throw new Error('jwt malformed');
    });

    const expectedErr = new Error('jwt malformed');
    await expect(authenticateUser(req, res, next)).rejects.toThrow(expectedErr);
    expect(next).not.toHaveBeenCalled();
  });

  it('should throw UnauthenticatedError when token is expired', async () => {
    req.cookies.token = 'expired-token';
    mockJwtService.verify.mockImplementation(() => {
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
    mockJwtService.verify.mockImplementation(() => {
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
