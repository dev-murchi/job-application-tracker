const { StatusCodes } = require('http-status-codes');
const { BadRequestError } = require('../errors');

const dbService = require('../db/db-service');
const User = dbService.getModel('User');

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

  const data = {
    ...(name && { name }),
    ...(lastName && { lastName }),
    ...(email && { email }),
    ...(location && { location }),
  };

  const user = await User.findOneAndUpdate({ _id: req.user.userId }, data, {
    new: true,
    runValidators: true,
  });

  res.status(StatusCodes.OK).json(formatUserResponse(user));
};

const getCurrentUser = (req, res) => {
  res.status(StatusCodes.OK).json(formatUserResponse(req.user));
};

module.exports = {
  getCurrentUser,
  updateUser,
};
