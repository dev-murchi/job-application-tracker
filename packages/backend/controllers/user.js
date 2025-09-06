const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');
const { BadRequestError } = require('../errors');
const attachCookie = require('../utils/attachCookie');

const updateUser = async (req, res) => {
  const { name, email, password, newPassword, location, lastName } = req.body;

  if (!password) {
    throw new BadRequestError('Password is required.');
  }

  if (!email && !name && !lastName && !location) {
    throw new BadRequestError('No changes provided');
  }

  const user = await User.findOne({ _id: req.user.userId }).select('+password');

  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    throw new BadRequestError('Current password is incorrect.');
  }

  if (newPassword) {
    if (newPassword === password) {
      throw new BadRequestError(
        'New password must be different from old password.'
      );
    }
    user.password = newPassword;
  }

  if (email) user.email = email;
  if (name) user.name = name;
  if (lastName) user.lastName = lastName;
  if (location) user.location = location;

  await user.save();

  const token = user.createJWT();
  attachCookie({ res, token });
  user.password = undefined;
  res.status(StatusCodes.OK).json({ user, location: user.location });
};

const getCurrentUser = async (req, res) => {
  const user = await User.findOne({ _id: req.user.userId });
  res.status(StatusCodes.OK).json({ user, location: user.location });
};

module.exports = {
  getCurrentUser,
  updateUser,
};
