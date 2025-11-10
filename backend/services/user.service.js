const { BadRequestError } = require('../errors');
const dbService = require('../db/db-service');

const User = dbService.getModel('User');

/**
 * Format user data for response (exclude sensitive fields)
 */
const formatUserResponse = (user) => ({
  email: user.email,
  lastName: user.lastName,
  location: user.location,
  name: user.name,
});

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

module.exports = {
  updateUserProfile,
  getUserById,
  formatUserResponse,
};
