const { describe, beforeEach, it, expect } = require('@jest/globals');
const { BadRequestError, UnauthenticatedError } = require('../../errors');
const { createAuthService } = require('../../services/auth.service');

// Mock user repository
const mockUser = {
  _id: 'user123',
  email: 'test@example.com',
  name: 'John',
  lastName: 'Doe',
  location: 'New York',
  password: 'hashedPassword',
};

const createMockUserRepository = () => ({
  findByEmail: jest.fn(),
  findByEmailWithPassword: jest.fn(),
  create: jest.fn(),
});

const createMockHasherService = () => ({
  hash: jest.fn(),
  compare: jest.fn(),
});

const createMockJwtService = () => ({
  sign: jest.fn(),
  verify: jest.fn(),
});

describe('Auth Service', () => {
  let authService;
  let mockUserRepository;
  let mockJwtService;
  let mockHasherService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserRepository = createMockUserRepository();
    mockJwtService = createMockJwtService();
    mockHasherService = createMockHasherService();
    authService = createAuthService({
      userRepository: mockUserRepository,
      jwtService: mockJwtService,
      hasherService: mockHasherService,
    });
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

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockHasherService.hash.mockResolvedValue('hashedPassword');
      mockUserRepository.create.mockResolvedValue(createdUser);

      const result = await authService.registerUser(userData);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(mockHasherService.hash).toHaveBeenCalledWith(userData.password);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        name: userData.name,
        lastName: userData.lastName,
        email: userData.email,
        password: 'hashedPassword',
        location: userData.location,
      });
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
      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      await expect(authService.registerUser(userData)).rejects.toThrow(BadRequestError);
      await expect(authService.registerUser(userData)).rejects.toThrow('Email already in use');

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should handle database errors during user creation', async () => {
      const userData = {
        name: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123',
        location: 'Chicago',
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockHasherService.hash.mockResolvedValue('hashedPassword');
      mockUserRepository.create.mockRejectedValue(new Error('Database error'));

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
      };

      mockUserRepository.findByEmailWithPassword.mockResolvedValue(foundUser);
      mockHasherService.compare.mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('jwt-token-123');

      const result = await authService.authenticateUser(credentials);

      expect(mockUserRepository.findByEmailWithPassword).toHaveBeenCalledWith(credentials.email);
      expect(mockHasherService.compare).toHaveBeenCalledWith(
        credentials.password,
        foundUser.password,
      );
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

      mockUserRepository.findByEmailWithPassword.mockResolvedValue(null);

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
      };

      mockUserRepository.findByEmailWithPassword.mockResolvedValue(foundUser);
      mockHasherService.compare.mockResolvedValue(false);

      await expect(authService.authenticateUser(credentials)).rejects.toThrow(UnauthenticatedError);
      await expect(authService.authenticateUser(credentials)).rejects.toThrow(
        'Invalid Credentials',
      );

      expect(mockHasherService.compare).toHaveBeenCalledWith(
        credentials.password,
        foundUser.password,
      );
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('should handle database errors during authentication', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockUserRepository.findByEmailWithPassword.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(authService.authenticateUser(credentials)).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});
