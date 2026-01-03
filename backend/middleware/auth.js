const { UnauthenticatedError } = require('../errors');
const { MongooseObjectIdSchema } = require('../schemas');

/**
 * @param {Object} dependencies - Dependency object
 * @param {Object} dependencies.dbService - Database service for accessing User model
 * @param {Object} dependencies.loggerService - Logger service instance for authentication logging
 * @param {Object} dependencies.jwtService - JWT service for token verification
 * @returns {Function} Express middleware function for JWT authentication
 */
const createAuthenticationMiddleware = ({ dbService, loggerService, jwtService }) => {
  const authenticateUser = async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
      loggerService.warn('Authentication failed: No token provided');
      throw new UnauthenticatedError('Authentication Invalid');
    }

    const payload = jwtService.verify(token);

    // Validate userId is a valid MongoDB ObjectId
    const userId = MongooseObjectIdSchema.parse(payload.userId);

    // Fetch user from database to verify existence
    const User = dbService.getModel('User');
    const user = await User.findOne({ _id: userId }).lean();

    if (!user) {
      loggerService.warn('Authentication failed: User not found');
      throw new UnauthenticatedError('Authentication Invalid');
    }

    // Attach validated user info to request
    req.user = { ...user, userId };

    next();
  };

  return {
    authenticateUser,
  };
};

module.exports = { createAuthenticationMiddleware };
