const { describe, beforeEach, afterEach, it, expect } = require('@jest/globals');

// Mock dependencies
jest.mock('../../db/db-service');
jest.mock('../../utils/attach-cookie.js');

const dbService = require('../../db/db-service');
const { StatusCodes } = require('http-status-codes');

// Mock User model
const User = {
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
};

// Setup dbService mock to return our mocked User model
dbService.getModel = jest.fn().mockImplementation((modelName) => {
  if (modelName === 'User') {
    return User;
  }
  return null;
});

const { getCurrentUser, updateUser } = require('../../controllers/user');

describe('User Controller', () => {
  let mockReq, mockRes;

  beforeEach(() => {
    mockReq = {
      body: {},
      user: {
        _id: 'user123',
        email: 'test@example.com',
        name: 'John',
        lastName: 'Doe',
        location: 'New York',
        userId: 'user123',
      },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentUser', () => {
    it('should return current user successfully', async () => {
      await getCurrentUser(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockRes.json).toHaveBeenCalledWith({
        email: mockReq.user.email,
        name: mockReq.user.name,
        lastName: mockReq.user.lastName,
        location: mockReq.user.location,
      });
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const updateData = {
        email: 'updated@example.com',
        name: 'Jane',
        lastName: 'Smith',
        location: 'Los Angeles',
      };
      mockReq.body = updateData;

      const updatedUser = {
        _id: 'user123',
        ...updateData,
      };

      User.findOneAndUpdate.mockResolvedValue(updatedUser);

      await updateUser(mockReq, mockRes);

      expect(User.findOneAndUpdate).toHaveBeenCalledWith({ _id: mockReq.user.userId }, updateData, {
        new: true,
        runValidators: true,
      });
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockRes.json).toHaveBeenCalledWith({
        email: updatedUser.email,
        name: updatedUser.name,
        lastName: updatedUser.lastName,
        location: updatedUser.location,
      });
    });

    it('should throw an error when no changes provided', async () => {
      mockReq.body = {};

      await expect(updateUser(mockReq, mockRes)).rejects.toThrow('No changes provided');
    });

    it('should handle update validation errors', async () => {
      mockReq.body = { email: 'invalid-email' };
      const error = new Error('Validation failed');
      User.findOneAndUpdate.mockRejectedValue(error);

      await expect(updateUser(mockReq, mockRes)).rejects.toThrow('Validation failed');
    });
  });
});
