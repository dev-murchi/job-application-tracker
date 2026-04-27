const { HttpStatusCodes } = require('../../../constants');
const { crateUserDTO } = require('../../../dtos/user.dto');

/**
 * Factory function to create user controller with injected dependencies
 * @param {Object} userService - User service instance
 * @returns {Object} User controller methods
 */
const createUserController = ({ userService }) => {
  /**
   * Update user profile
   */
  const updateUser = async (req, res) => {
    const user = await userService.updateUserProfile(req.user.userId, req.body);
    res.status(HttpStatusCodes.OK).json(user);
  };

  /**
   * Get current user profile
   */
  const getCurrentUser = (req, res) => {
    const formattedUser = crateUserDTO(req.user);
    res.status(HttpStatusCodes.OK).json(formattedUser);
  };

  return {
    getCurrentUser,
    updateUser,
  };
};

module.exports = {
  createUserController,
};
