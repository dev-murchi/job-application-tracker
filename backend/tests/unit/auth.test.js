const { describe, beforeEach, afterEach, it, expect } = require('@jest/globals');

// Mock services BEFORE requiring anything else
jest.mock('../../services', () => ({
  authService: {
    registerUser: jest.fn(),
    authenticateUser: jest.fn(),
  },
}));

// Mock dependencies before importing the controller
jest.mock('../../utils/attach-cookie.js');

const { attachCookie } = require('../../utils');
const { authService } = require('../../services');
const { StatusCodes } = require('http-status-codes');

const { authController } = require('../../controllers');

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

      const formattedUser = {
        email: userData.email,
        name: userData.name,
        lastName: userData.lastName,
        location: userData.location,
      };

      authService.registerUser.mockResolvedValue(formattedUser);

      await authController.register(mockReq, mockRes);

      expect(authService.registerUser).toHaveBeenCalledWith(userData);
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.CREATED);
      expect(mockRes.json).toHaveBeenCalledWith(formattedUser);
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

      authService.registerUser.mockRejectedValue(new Error('Email already in use'));

      await expect(authController.register(mockReq, mockRes)).rejects.toThrow(
        'Email already in use',
      );
      expect(authService.registerUser).toHaveBeenCalledWith(userData);
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

      const error = new Error('Database error');
      authService.registerUser.mockRejectedValue(error);

      await expect(authController.register(mockReq, mockRes)).rejects.toThrow('Database error');
      expect(authService.registerUser).toHaveBeenCalledWith(userData);
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

      const mockAuthResult = {
        user: {
          email: loginData.email,
          name: 'John',
          lastName: 'Doe',
          location: 'New York',
        },
        token: 'mock-jwt-token',
      };

      authService.authenticateUser.mockResolvedValue(mockAuthResult);

      await authController.login(mockReq, mockRes);

      expect(authService.authenticateUser).toHaveBeenCalledWith(loginData);
      expect(attachCookie).toHaveBeenCalledWith({
        res: mockRes,
        token: 'mock-jwt-token',
      });
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockRes.json).toHaveBeenCalledWith(mockAuthResult.user);
    });

    it('should throw error when user not found', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };
      mockReq.body = loginData;

      authService.authenticateUser.mockRejectedValue(new Error('Invalid Credentials'));

      await expect(authController.login(mockReq, mockRes)).rejects.toThrow('Invalid Credentials');
      expect(authService.authenticateUser).toHaveBeenCalledWith(loginData);
      expect(attachCookie).not.toHaveBeenCalled();
    });

    it('should throw error when password is incorrect', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };
      mockReq.body = loginData;

      authService.authenticateUser.mockRejectedValue(new Error('Invalid Credentials'));

      await expect(authController.login(mockReq, mockRes)).rejects.toThrow('Invalid Credentials');
      expect(authService.authenticateUser).toHaveBeenCalledWith(loginData);
      expect(attachCookie).not.toHaveBeenCalled();
    });

    it('should not call attachCookie when authentication fails', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };
      mockReq.body = loginData;

      authService.authenticateUser.mockRejectedValue(new Error('Invalid Credentials'));

      await expect(authController.login(mockReq, mockRes)).rejects.toThrow('Invalid Credentials');
      expect(attachCookie).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      await authController.logout(mockReq, mockRes);

      expect(mockRes.cookie).toHaveBeenCalledWith('token', 'logout', {
        httpOnly: true,
        expires: expect.any(Date),
      });
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockRes.json).toHaveBeenCalledWith({ msg: 'user logged out!' });
    });

    it('should set logout cookie with expiration in the past', async () => {
      const beforeLogout = Date.now();

      await authController.logout(mockReq, mockRes);

      const cookieCall = mockRes.cookie.mock.calls[0];
      const expirationDate = cookieCall[2].expires;
      const afterLogout = Date.now();

      // The expiration should be roughly 1 second from now (Date.now() + 1000)
      expect(expirationDate.getTime()).toBeGreaterThan(beforeLogout);
      expect(expirationDate.getTime()).toBeLessThan(afterLogout + 2000);
    });
  });
});
