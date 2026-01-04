const { describe, beforeEach, afterEach, it, expect } = require('@jest/globals');

const { StatusCodes } = require('http-status-codes');
const { createUserController } = require('../../controllers/user');

// Mock user service factory
const createMockUserService = () => ({
  updateUserProfile: jest.fn(),
  formatUserResponse: jest.fn(),
});

describe('User Controller', () => {
  let mockReq, mockRes, mockUserService, userController;

  beforeEach(() => {
    mockUserService = createMockUserService();
    userController = createUserController({ userService: mockUserService });

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
    it('should return current user successfully', () => {
      const formattedUser = {
        email: mockReq.user.email,
        name: mockReq.user.name,
        lastName: mockReq.user.lastName,
        location: mockReq.user.location,
      };

      mockUserService.formatUserResponse.mockReturnValue(formattedUser);

      userController.getCurrentUser(mockReq, mockRes);

      expect(mockUserService.formatUserResponse).toHaveBeenCalledWith(mockReq.user);
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockRes.json).toHaveBeenCalledWith(formattedUser);
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
        email: updateData.email,
        name: updateData.name,
        lastName: updateData.lastName,
        location: updateData.location,
      };

      mockUserService.updateUserProfile.mockResolvedValue(updatedUser);

      await userController.updateUser(mockReq, mockRes);

      expect(mockUserService.updateUserProfile).toHaveBeenCalledWith(
        mockReq.user.userId,
        updateData,
      );
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(mockRes.json).toHaveBeenCalledWith(updatedUser);
    });

    it('should throw an error when no changes provided', async () => {
      mockReq.body = {};

      mockUserService.updateUserProfile.mockRejectedValue(new Error('No changes provided'));

      await expect(userController.updateUser(mockReq, mockRes)).rejects.toThrow(
        'No changes provided',
      );
    });

    it('should handle update validation errors', async () => {
      mockReq.body = { email: 'invalid-email' };
      const error = new Error('Validation failed');

      mockUserService.updateUserProfile.mockRejectedValue(error);

      await expect(userController.updateUser(mockReq, mockRes)).rejects.toThrow(
        'Validation failed',
      );
    });
  });
});
