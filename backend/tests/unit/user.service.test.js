const { describe, beforeEach, it, expect } = require('@jest/globals');
const { BadRequestError } = require('../../errors');

// Mock dependencies
jest.mock('../../db/db-service');

const dbService = require('../../db/db-service');

// Mock User model
const User = {
  findById: jest.fn(),
  findOneAndUpdate: jest.fn(),
};

// Setup dbService mock
dbService.getModel = jest.fn().mockImplementation((modelName) => {
  if (modelName === 'User') {
    return User;
  }
  return null;
});

const userService = require('../../services/user.service');

describe('User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

      const formatted = userService.formatUserResponse(user);

      expect(formatted).toEqual({
        email: 'john@example.com',
        name: 'John',
        lastName: 'Doe',
        location: 'NYC',
      });
      expect(formatted.password).toBeUndefined();
      expect(formatted._id).toBeUndefined();
    });

    it('should handle user with undefined optional fields', () => {
      const user = {
        email: 'test@test.com',
        name: 'Test',
        lastName: undefined,
        location: undefined,
      };

      const formatted = userService.formatUserResponse(user);

      expect(formatted).toEqual({
        email: 'test@test.com',
        name: 'Test',
        lastName: undefined,
        location: undefined,
      });
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const userId = 'user123';
      const updates = {
        name: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        location: 'Boston',
      };

      const updatedUser = {
        _id: userId,
        ...updates,
      };

      User.findOneAndUpdate.mockResolvedValue(updatedUser);

      const result = await userService.updateUserProfile(userId, updates);

      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: userId },
        {
          name: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          location: 'Boston',
        },
        { new: true, runValidators: true },
      );
      expect(result).toEqual({
        email: updates.email,
        name: updates.name,
        lastName: updates.lastName,
        location: updates.location,
      });
    });

    it('should update only provided fields', async () => {
      const userId = 'user123';
      const updates = {
        name: 'UpdatedName',
      };

      const updatedUser = {
        _id: userId,
        name: 'UpdatedName',
        lastName: 'Doe',
        email: 'john@example.com',
        location: 'NYC',
      };

      User.findOneAndUpdate.mockResolvedValue(updatedUser);

      const result = await userService.updateUserProfile(userId, updates);

      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: userId },
        { name: 'UpdatedName' },
        { new: true, runValidators: true },
      );
      expect(result.name).toBe('UpdatedName');
    });

    it('should throw BadRequestError when no changes provided', async () => {
      const userId = 'user123';
      const updates = {};

      await expect(userService.updateUserProfile(userId, updates)).rejects.toThrow(BadRequestError);
      await expect(userService.updateUserProfile(userId, updates)).rejects.toThrow(
        'No changes provided',
      );

      expect(User.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('should throw BadRequestError when all fields are undefined', async () => {
      const userId = 'user123';
      const updates = {
        name: undefined,
        email: undefined,
        lastName: undefined,
        location: undefined,
      };

      await expect(userService.updateUserProfile(userId, updates)).rejects.toThrow(BadRequestError);
    });

    it('should handle partial updates correctly', async () => {
      const userId = 'user123';
      const updates = {
        name: 'NewName',
        location: 'Chicago',
      };

      const updatedUser = {
        _id: userId,
        name: 'NewName',
        lastName: 'Doe',
        email: 'john@example.com',
        location: 'Chicago',
      };

      User.findOneAndUpdate.mockResolvedValue(updatedUser);

      const result = await userService.updateUserProfile(userId, updates);

      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: userId },
        {
          name: 'NewName',
          location: 'Chicago',
        },
        { new: true, runValidators: true },
      );
      expect(result.name).toBe('NewName');
      expect(result.location).toBe('Chicago');
    });

    it('should handle database errors during update', async () => {
      const userId = 'user123';
      const updates = {
        name: 'Test',
      };

      User.findOneAndUpdate.mockRejectedValue(new Error('Database error'));

      await expect(userService.updateUserProfile(userId, updates)).rejects.toThrow(
        'Database error',
      );
    });

    it('should not include password in response even if database returns it', async () => {
      const userId = 'user123';
      const updates = {
        name: 'Test',
      };

      const updatedUser = {
        _id: userId,
        name: 'Test',
        email: 'test@test.com',
        lastName: 'User',
        location: 'NYC',
        password: 'hashedPassword',
      };

      User.findOneAndUpdate.mockResolvedValue(updatedUser);

      const result = await userService.updateUserProfile(userId, updates);

      expect(result.password).toBeUndefined();
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const userId = 'user123';
      const mockUser = {
        _id: userId,
        name: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        location: 'NYC',
      };

      User.findById.mockResolvedValue(mockUser);

      const result = await userService.getUserById(userId);

      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      const userId = 'nonexistent123';

      User.findById.mockResolvedValue(null);

      const result = await userService.getUserById(userId);

      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const userId = 'user123';

      User.findById.mockRejectedValue(new Error('Database connection failed'));

      await expect(userService.getUserById(userId)).rejects.toThrow('Database connection failed');
    });
  });
});
