const { StatusCodes } = require('http-status-codes');

/**
 * Factory function to create user controller with injected dependencies
 * @param {Object} userService - User service instance
 * @returns {Object} User controller methods
 */
const createUserController = (userService) => {
  /**
   * Update user profile
   */
  const updateUser = async (req, res) => {
    const user = await userService.updateUserProfile(req.user.userId, req.body);
    res.status(StatusCodes.OK).json(user);
  };

  /**
   * Get current user profile
   */
  const getCurrentUser = (req, res) => {
    const formattedUser = userService.formatUserResponse(req.user);
    res.status(StatusCodes.OK).json(formattedUser);
  };

  return {
    getCurrentUser,
    updateUser,
  };
};

module.exports = {
  createUserController,
};
