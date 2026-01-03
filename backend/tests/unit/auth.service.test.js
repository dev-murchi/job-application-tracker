const { describe, beforeEach, it, expect } = require('@jest/globals');
const { BadRequestError, UnauthenticatedError } = require('../../errors');
const { createAuthService } = require('../../services/auth.service');

// Mock User model
const mockUser = {
  _id: 'user123',
  email: 'test@example.com',
  name: 'John',
  lastName: 'Doe',
  location: 'New York',
  password: 'hashedPassword',
  comparePassword: jest.fn(),
};

const createMockUser = () => ({
  create: jest.fn(),
  findOne: jest.fn(),
});

// Create mock dbService
const createMockDbService = (User) => ({
  getModel: jest.fn().mockImplementation((modelName) => {
    if (modelName === 'User') {
      return User;
    }
    return null;
  }),
});

// Create mock jwtService
const createMockJwtService = () => ({
  sign: jest.fn(),
  verify: jest.fn(),
});

describe('Auth Service', () => {
  let authService;
  let mockDbService;
  let mockJwtService;
  let User;

  beforeEach(() => {
    jest.clearAllMocks();
    User = createMockUser();
    mockDbService = createMockDbService(User);
    mockJwtService = createMockJwtService();
    authService = createAuthService({ dbService: mockDbService, jwtService: mockJwtService });
  });

  describe('formatUserResponse', () => {
    it('should format user data correctly', () => {
      const user = {
        _id: 'user123',
        email: 'john@example.com',
        name: 'John',
        lastName: 'Doe',
        location: 'NYC',
        password: 'hashedPassword',
        createdAt: new Date(),
      };

      const formatted = authService.formatUserResponse(user);

      expect(formatted).toEqual({
        email: 'john@example.com',
        name: 'John',
        lastName: 'Doe',
        location: 'NYC',
      });
      expect(formatted.password).toBeUndefined();
      expect(formatted._id).toBeUndefined();
      expect(formatted.createdAt).toBeUndefined();
    });

    it('should handle user with missing optional fields', () => {
      const user = {
        email: 'test@test.com',
        name: 'Test',
        lastName: undefined,
        location: undefined,
      };

      const formatted = authService.formatUserResponse(user);

      expect(formatted).toEqual({
        email: 'test@test.com',
        name: 'Test',
        lastName: undefined,
        location: undefined,
      });
    });
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        password: 'SecurePass123',
        location: 'Boston',
      };

      const createdUser = {
        _id: 'newUser123',
        ...userData,
        password: 'hashedPassword',
      };

      User.findOne.mockResolvedValue(null); // No existing user
      User.create.mockResolvedValue(createdUser);

      const result = await authService.registerUser(userData);

      expect(User.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(User.create).toHaveBeenCalledWith(userData);
      expect(result).toEqual({
        email: userData.email,
        name: userData.name,
        lastName: userData.lastName,
        location: userData.location,
      });
      expect(result.password).toBeUndefined();
    });

    it('should throw BadRequestError when email already exists', async () => {
      const userData = {
        name: 'John',
        lastName: 'Doe',
        email: 'existing@example.com',
        password: 'TestPass123',
        location: 'NYC',
      };

      const existingUser = { _id: 'existing123', email: userData.email };
      User.findOne.mockResolvedValue(existingUser);

      await expect(authService.registerUser(userData)).rejects.toThrow(BadRequestError);
      await expect(authService.registerUser(userData)).rejects.toThrow('Email already in use');

      expect(User.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(User.create).not.toHaveBeenCalled();
    });

    it('should handle database errors during user creation', async () => {
      const userData = {
        name: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123',
        location: 'Chicago',
      };

      User.findOne.mockResolvedValue(null);
      User.create.mockRejectedValue(new Error('Database error'));

      await expect(authService.registerUser(userData)).rejects.toThrow('Database error');
    });
  });

  describe('authenticateUser', () => {
    it('should authenticate user with valid credentials', async () => {
      const credentials = {
        email: 'john@example.com',
        password: 'correctPassword',
      };

      const foundUser = {
        ...mockUser,
        comparePassword: jest.fn().mockResolvedValue(true),
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(foundUser),
      });
      mockJwtService.sign.mockReturnValue('jwt-token-123');

      const result = await authService.authenticateUser(credentials);

      expect(User.findOne).toHaveBeenCalledWith({ email: credentials.email });
      expect(foundUser.comparePassword).toHaveBeenCalledWith(credentials.password);
      expect(mockJwtService.sign).toHaveBeenCalledWith({ userId: foundUser._id });
      expect(result).toEqual({
        user: {
          email: foundUser.email,
          name: foundUser.name,
          lastName: foundUser.lastName,
          location: foundUser.location,
        },
        token: 'jwt-token-123',
      });
    });

    it('should throw UnauthenticatedError when user not found', async () => {
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await expect(authService.authenticateUser(credentials)).rejects.toThrow(UnauthenticatedError);
      await expect(authService.authenticateUser(credentials)).rejects.toThrow(
        'Invalid Credentials',
      );
    });

    it('should throw UnauthenticatedError when password is incorrect', async () => {
      const credentials = {
        email: 'john@example.com',
        password: 'wrongPassword',
      };

      const foundUser = {
        ...mockUser,
        comparePassword: jest.fn().mockResolvedValue(false),
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(foundUser),
      });

      await expect(authService.authenticateUser(credentials)).rejects.toThrow(UnauthenticatedError);
      await expect(authService.authenticateUser(credentials)).rejects.toThrow(
        'Invalid Credentials',
      );

      expect(foundUser.comparePassword).toHaveBeenCalledWith(credentials.password);
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('should handle database errors during authentication', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Database connection failed')),
      });

      await expect(authService.authenticateUser(credentials)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});
