const { StatusCodes } = require('http-status-codes');
const { attachCookie } = require('../utils');
const { authService } = require('../services');

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

  attachCookie({ res, token });

  res.status(StatusCodes.OK).json(user);
};

/**
 * Logout user by clearing authentication cookie
 */
const logout = (req, res) => {
  const oneSec = 1000;
  res.cookie('token', 'logout', {
    httpOnly: true,
    expires: new Date(Date.now() + oneSec),
  });
  res.status(StatusCodes.OK).json({ msg: 'user logged out!' });
};

module.exports = {
  register,
  login,
  logout,
};
