const jwt = require('jsonwebtoken');
const { UnauthenticatedError } = require('../errors');
const config = require('../config');
const { MongooseObjectIdSchema } = require('../schemas');
const dbService = require('../db/db-service');
const { logger } = require('../utils');

const authenticateUser = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    logger.warn('Authentication failed: No token provided');
    throw new UnauthenticatedError('Authentication Invalid');
  }

  const payload = jwt.verify(token, config.jwtSecret);

  // Validate userId is a valid MongoDB ObjectId
  const userId = MongooseObjectIdSchema.parse(payload.userId);

  // Fetch user from database to verify existence

  const User = dbService.getModel('User');
  const user = await User.findOne({ _id: userId }).lean();

  if (!user) {
    logger.warn('Authentication failed: User not found');
    throw new UnauthenticatedError('Authentication Invalid');
  }

  // Attach validated user info to request
  req.user = { ...user, userId };

  next();
};

module.exports = authenticateUser;
