const { StatusCodes } = require('http-status-codes');
const { attachCookie } = require('../utils');
const { ONE_SECOND_MS } = require('../constants');

/**
 * Factory function to create auth controller with injected dependencies
 * @param {Object} dependencies - Dependency object
 * @param {Object} dependencies.authService - Auth service instance
 * @param {Object} dependencies.configService - Configuration service
 * @returns {Object} Auth controller methods
 */
const createAuthController = ({ authService, configService }) => {
  /**
   * Register a new user
   */
  const register = async (req, res) => {
    const user = await authService.registerUser(req.body);
    res.status(StatusCodes.CREATED).json(user);
  };

  /**
   * Login user and set authentication cookie
   */
  const login = async (req, res) => {
    const { user, token } = await authService.authenticateUser(req.body);

    attachCookie({ res, token, secure: configService.get('isProduction') });

    res.status(StatusCodes.OK).json(user);
  };

  /**
   * Logout user by clearing authentication cookie
   */
  const logout = (req, res) => {
    res.cookie('token', 'logout', {
      httpOnly: true,
      expires: new Date(Date.now() + ONE_SECOND_MS),
    });
    res.status(StatusCodes.OK).json({ msg: 'user logged out!' });
  };

  return {
    register,
    login,
    logout,
  };
};

module.exports = {
  createAuthController,
};
