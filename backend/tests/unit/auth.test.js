const { describe, beforeEach, afterEach, it, expect } = require('@jest/globals');

// Mock dependencies before importing the controller
jest.mock('../../utils/attach-cookie.js');
jest.mock('../../db/db-service');

const dbService = require('../../db/db-service');
const attachCookie = require('../../utils/attach-cookie.js');
const { StatusCodes } = require('http-status-codes');

// Mock User model
const User = {
  create: jest.fn(),
  findOne: jest.fn(),
};

// Setup dbService mock to return our mocked User model
dbService.getModel = jest.fn().mockImplementation((modelName) => {
  if (modelName === 'User') {
    return User;
  }
  return null;
});

const { register, login, logout } = require('../../controllers/auth');

describe('Auth Controller', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      body: {},
      cookies: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'TestPass123',
        location: 'New York',
      };
      mockReq.body = userData;

      const mockUser = {
        _id: 'user123',
        email: userData.email,
        name: userData.name,
        lastName: userData.lastName,
        location: userData.location,
      };

      User.findOne.mockResolvedValue(null); // No existing user
      User.create.mockResolvedValue(mockUser);

      await register(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(User.create).toHaveBeenCalledWith({
        name: userData.name,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        location: userData.location,
      });
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.CREATED);
      expect(mockRes.json).toHaveBeenCalledWith({
        email: mockUser.email,
        lastName: mockUser.lastName,
        location: mockUser.location,
        name: mockUser.name,
      });
    });

    it('should throw error when email already exists', async () => {
      const userData = {
        name: 'John',
        lastName: 'Doe',
        email: 'existing@example.com',
        password: 'TestPass123',
        location: 'New York',
      };
      mockReq.body = userData;

      const existingUser = {
        _id: 'existingUser123',
        email: userData.email,
      };

      User.findOne.mockResolvedValue(existingUser); // User already exists

      await expect(register(mockReq, mockRes)).rejects.toThrow('Email already in use');
      expect(User.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(User.create).not.toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    it('should handle user creation errors', async () => {
      const userData = {
        name: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'TestPass123',
        location: 'New York',
      };
      mockReq.body = userData;

      User.findOne.mockResolvedValue(null); // No existing user
      const error = new Error('Database error');
      User.create.mockRejectedValue(error);

      await expect(register(mockReq, mockRes)).rejects.toThrow('Database error');
      expect(User.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(User.create).toHaveBeenCalledWith(userData);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'TestPass123',
      };
      mockReq.body = loginData;

      const mockUser = {
        _id: 'user123',
        email: loginData.email,
        name: 'John',
        lastName: 'Doe',
        location: 'New York',
        comparePassword: jest.fn().mockResolvedValue(true),
        createJWT: jest.fn().mockReturnValue('mock-jwt-token'),
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await login(mockReq, mockRes);

      expect(User.findOne).toHaveBeenCalledWith({ email: loginData.email });
      expect(User.findOne().select).toHaveBeenCalledWith('+password');
      expect(mockUser.comparePassword).toHaveBeenCalledWith(loginData.password);
      expect(mockUser.createJWT).toHaveBeenCalled();
      expect(attachCookie).toHaveBeenCalledWith({
        res: mockRes,
        token: 'mock-jwt-token',
      });
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockRes.json).toHaveBeenCalledWith({
        email: mockUser.email,
        lastName: mockUser.lastName,
        location: mockUser.location,
        name: mockUser.name,
      });
    });

    it('should throw error when user not found', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'TestPass123',
      };
      mockReq.body = loginData;

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await expect(login(mockReq, mockRes)).rejects.toThrow('Invalid Credentials');
      expect(User.findOne).toHaveBeenCalledWith({ email: loginData.email });
      expect(User.findOne().select).toHaveBeenCalledWith('+password');
    });

    it('should throw error when password is incorrect', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };
      mockReq.body = loginData;

      const mockUser = {
        _id: 'user123',
        email: loginData.email,
        comparePassword: jest.fn().mockResolvedValue(false),
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await expect(login(mockReq, mockRes)).rejects.toThrow('Invalid Credentials');
      expect(User.findOne).toHaveBeenCalledWith({ email: loginData.email });
      expect(mockUser.comparePassword).toHaveBeenCalledWith(loginData.password);
    });

    it('should not call attachCookie or createJWT when authentication fails', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };
      mockReq.body = loginData;

      const mockUser = {
        comparePassword: jest.fn().mockResolvedValue(false),
        createJWT: jest.fn(),
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await expect(login(mockReq, mockRes)).rejects.toThrow('Invalid Credentials');
      expect(mockUser.createJWT).not.toHaveBeenCalled();
      expect(attachCookie).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      await logout(mockReq, mockRes);

      expect(mockRes.cookie).toHaveBeenCalledWith('token', 'logout', {
        httpOnly: true,
        expires: expect.any(Date),
      });
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockRes.json).toHaveBeenCalledWith({ msg: 'user logged out!' });
    });

    it('should set logout cookie with expiration in the past', async () => {
      const beforeLogout = Date.now();

      await logout(mockReq, mockRes);

      const cookieCall = mockRes.cookie.mock.calls[0];
      const expirationDate = cookieCall[2].expires;
      const afterLogout = Date.now();

      // The expiration should be roughly 1 second from now (Date.now() + 1000)
      expect(expirationDate.getTime()).toBeGreaterThan(beforeLogout);
      expect(expirationDate.getTime()).toBeLessThan(afterLogout + 2000);
    });
  });
});
