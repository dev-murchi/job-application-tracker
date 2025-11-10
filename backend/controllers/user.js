const { StatusCodes } = require('http-status-codes');
const { userService } = require('../services');

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

module.exports = {
  getCurrentUser,
  updateUser,
};
