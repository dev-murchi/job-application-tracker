const { BadRequestError } = require('../errors');
const { formatUserResponse } = require('./formatters');

/**
 * Factory function to create user service with injected dependencies
 * @param {Object} userRepository - User database repository
 * @returns {Object} User service methods
 */
const createUserService = ({ userRepository }) => {
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

    const user = await userRepository.updateById(userId, data);

    return formatUserResponse(user);
  };

  /**
   * Get user by ID
   * @param {String} userId - User ID
   * @returns {Object} User data
   */
  const getUserById = async (userId) => {
    const user = await userRepository.findById(userId);
    return formatUserResponse(user);
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
