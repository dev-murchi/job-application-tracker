const { describe, beforeEach, it, expect } = require('@jest/globals');
const { BadRequestError } = require('../../../errors');

const { createUserService } = require('../../../services/user.service');

// Create mock userRepository
const createMockUserRepository = () => ({
  findById: jest.fn(),
  updateById: jest.fn(),
});

describe('User Service', () => {
  let userService;
  let mockUserRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserRepository = createMockUserRepository();
    userService = createUserService({ userRepository: mockUserRepository });
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

      mockUserRepository.updateById.mockResolvedValue(updatedUser);

      const result = await userService.updateUserProfile(userId, updates);

      expect(mockUserRepository.updateById).toHaveBeenCalledWith(userId, {
        name: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        location: 'Boston',
      });
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

      mockUserRepository.updateById.mockResolvedValue(updatedUser);

      const result = await userService.updateUserProfile(userId, updates);

      expect(mockUserRepository.updateById).toHaveBeenCalledWith(userId, { name: 'UpdatedName' });
      expect(result.name).toBe('UpdatedName');
    });

    it('should throw BadRequestError when no changes provided', async () => {
      const userId = 'user123';
      const updates = {};

      await expect(userService.updateUserProfile(userId, updates)).rejects.toThrow(BadRequestError);
      await expect(userService.updateUserProfile(userId, updates)).rejects.toThrow(
        'No changes provided',
      );

      expect(mockUserRepository.updateById).not.toHaveBeenCalled();
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

      mockUserRepository.updateById.mockResolvedValue(updatedUser);

      const result = await userService.updateUserProfile(userId, updates);

      expect(mockUserRepository.updateById).toHaveBeenCalledWith(userId, {
        name: 'NewName',
        location: 'Chicago',
      });
      expect(result.name).toBe('NewName');
      expect(result.location).toBe('Chicago');
    });

    it('should handle database errors during update', async () => {
      const userId = 'user123';
      const updates = {
        name: 'Test',
      };

      mockUserRepository.updateById.mockRejectedValue(new Error('Database error'));

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

      mockUserRepository.updateById.mockResolvedValue(updatedUser);

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

      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await userService.getUserById(userId);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual({
        email: mockUser.email,
        name: mockUser.name,
        lastName: mockUser.lastName,
        location: mockUser.location,
      });
    });

    it('should throw when user not found', async () => {
      const userId = 'nonexistent123';

      mockUserRepository.findById.mockResolvedValue(null);

      await expect(userService.getUserById(userId)).rejects.toThrow();
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
    });

    it('should handle database errors', async () => {
      const userId = 'user123';

      mockUserRepository.findById.mockRejectedValue(new Error('Database connection failed'));

      await expect(userService.getUserById(userId)).rejects.toThrow('Database connection failed');
    });
  });
});
