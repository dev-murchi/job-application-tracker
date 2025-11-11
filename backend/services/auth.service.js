const { BadRequestError, UnauthenticatedError } = require('../errors');
const { formatUserResponse } = require('./formatters');

/**
 * Factory function to create auth service with injected dependencies
 * @param {Object} dbService - Database service for accessing models
 * @returns {Object} Auth service methods
 */
const createAuthService = (dbService) => {
  const User = dbService.getModel('User');

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Object} Formatted user data
   * @throws {BadRequestError} If email already exists
   */
  const registerUser = async (userData) => {
    const { name, lastName, email, password, location } = userData;

    const userAlreadyExists = await User.findOne({ email });

    if (userAlreadyExists) {
      throw new BadRequestError('Email already in use');
    }

    const user = await User.create({ name, lastName, email, password, location });

    return formatUserResponse(user);
  };

  /**
   * Authenticate user and generate JWT
   * @param {Object} credentials - Login credentials
   * @returns {Object} User data and JWT token
   * @throws {UnauthenticatedError} If credentials are invalid
   */
  const authenticateUser = async (credentials) => {
    const { email, password } = credentials;

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      throw new UnauthenticatedError('Invalid Credentials');
    }

    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      throw new UnauthenticatedError('Invalid Credentials');
    }

    const token = user.createJWT();

    return {
      user: formatUserResponse(user),
      token,
    };
  };

  return {
    registerUser,
    authenticateUser,
    formatUserResponse,
  };
};

module.exports = {
  createAuthService,
};
