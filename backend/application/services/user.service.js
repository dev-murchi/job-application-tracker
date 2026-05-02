/**@typedef {import('../../shared/dtos/user.dto').UpdateProfileInput} UpdateProfileInput */
/**@typedef {import('../../shared/dtos/user.dto').UserDTO} UserDTO */
/**@typedef {import('../ports/driving/user.service.port').UserServicePort} UserServicePort */
/**@typedef {import('../ports/driven/database/user.repository.port').UserRepositoryPort} UserRepositoryPort */

const { BadRequestError } = require('../../shared/errors');
const { crateUserDTO } = require('../../shared/dtos/user.dto');

/**
 * Factory function to create user service with injected dependencies
 * @param {Object} dependencies - Dependency object
 * @param {UserRepositoryPort} dependencies.userRepository - User database repository
 * @returns {UserServicePort} User service methods
 */
const createUserService = ({ userRepository }) => {
  /**
   * Update user profile
   * @param {String} userId - User ID
   * @param {UpdateProfileInput} updates - Fields to update
   * @returns {UserDTO} Updated user data
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

    return crateUserDTO(user);
  };

  /**
   * Get user by ID
   * @param {String} userId - User ID
   * @returns {UserDTO} User data
   */
  const getUserById = async (userId) => {
    const user = await userRepository.findById(userId);
    return crateUserDTO(user);
  };

  return {
    updateUserProfile,
    getUserById,
  };
};

module.exports = {
  createUserService,
};
