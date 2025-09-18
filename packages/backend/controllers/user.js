const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');
const { BadRequestError } = require('../errors');

const formatUserResponse = (user) => ({
  email: user.email,
  lastName: user.lastName,
  location: user.location,
  name: user.name,
});

const updateUser = async (req, res) => {
  const { name, email, location, lastName } = req.body;

  if (!email && !name && !lastName && !location) {
    throw new BadRequestError('No changes provided');
  }

  const user = await User.findOne({ _id: req.user.userId });

  if (email) user.email = email;
  if (name) user.name = name;
  if (lastName) user.lastName = lastName;
  if (location) user.location = location;

  await user.save();

  res.status(StatusCodes.OK).json(formatUserResponse(user));
};

const getCurrentUser = async (req, res) => {
  const user = await User.findOne({ _id: req.user.userId });
  res.status(StatusCodes.OK).json(formatUserResponse(user));
};

module.exports = {
  getCurrentUser,
  updateUser,
};
