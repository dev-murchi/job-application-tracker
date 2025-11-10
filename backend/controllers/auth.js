const { StatusCodes } = require('http-status-codes');
const { BadRequestError, UnauthenticatedError } = require('../errors/index.js');
const { attachCookie } = require('../utils');

const dbService = require('../db/db-service');
const User = dbService.getModel('User');

// Helper functions
const formatUserResponse = (user) => ({
  email: user.email,
  lastName: user.lastName,
  location: user.location,
  name: user.name,
});

// Main controller functions
const register = async (req, res) => {
  const { name, lastName, email, password, location } = req.body;

  const userAlreadyExists = await User.findOne({ email });

  if (userAlreadyExists) {
    throw new BadRequestError('Email already in use');
  }

  const user = await User.create({ name, lastName, email, password, location });

  res.status(StatusCodes.CREATED).json(formatUserResponse(user));
};

const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw new UnauthenticatedError('Invalid Credentials');
  }

  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    throw new UnauthenticatedError('Invalid Credentials');
  }

  const token = user.createJWT();

  attachCookie({ res, token });

  res.status(StatusCodes.OK).json(formatUserResponse(user));
};

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
