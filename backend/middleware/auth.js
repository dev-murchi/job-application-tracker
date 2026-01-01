const jwt = require('jsonwebtoken');
const { UnauthenticatedError } = require('../errors');
const config = require('../config');
const { MongooseObjectIdSchema } = require('../schemas');

/**
 * Factory function to create authentication middleware with injected dependencies
 * @param {Object} dbService - Database service for accessing User model
 * @param {Object} logger - Logger instance for authentication logging
 * @returns {Function} Express middleware function for JWT authentication
 */
const createAuthenticateUser = (dbService, logger) => {
  return async (req, res, next) => {
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
};

module.exports = { createAuthenticateUser };
