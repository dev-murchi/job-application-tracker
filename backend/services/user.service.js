const { BadRequestError } = require('../errors');
const { formatUserResponse } = require('./formatters');

/**
 * Factory function to create user service with injected dependencies
 * @param {Object} dbService - Database service for accessing models
 * @returns {Object} User service methods
 */
const createUserService = ({ dbService }) => {
  const User = dbService.getModel('User');

  /**
   * Update user profile
   * @param {String} userId - User ID
   * @param {Object} updates - Fields to update
   * @returns {Object} Updated user data
   * @throws {BadRequestError} If no updates provided
   */
  const updateUserProfile = async (userId, updates) => {
    const { name, email, location, lastName } = updates;

    if (!email && !name && !lastName && !location) {
      throw new BadRequestError('No changes provided');
    }

    const data = {
      ...(name && { name }),
      ...(lastName && { lastName }),
      ...(email && { email }),
      ...(location && { location }),
    };

    const user = await User.findOneAndUpdate({ _id: userId }, data, {
      new: true,
      runValidators: true,
    });

    return formatUserResponse(user);
  };

  /**
   * Get user by ID
   * @param {String} userId - User ID
   * @returns {Object} User data
   */
  const getUserById = async (userId) => {
    const user = await User.findById(userId);
    return user;
  };

  return {
    updateUserProfile,
    getUserById,
    formatUserResponse,
  };
};

module.exports = {
  createUserService,
};
