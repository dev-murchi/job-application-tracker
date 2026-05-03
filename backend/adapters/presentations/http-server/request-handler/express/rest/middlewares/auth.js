const { UnauthenticatedError } = require('../../../../../../../shared/errors');
const { MongooseObjectIdSchema } = require('../../../../../../../shared/schemas');

/**@typedef {import('../../../../../../../application/ports/driven/database/user.repository.port').UserRepositoryPort} UserRepositoryPort */
/**@typedef {import('../../../../../../../application/ports/driven/security/token.service.port').TokenServicePort} TokenServicePort */
/**@typedef {import('../../../../../../../application/ports/driven/logger/logger.service.port').LoggerServicePort} LoggerServicePort*/

/**
 * @param {Object} dependencies - Dependency object
 * @param {UserRepositoryPort} dependencies.userRepository - User database repository
 * @param {LoggerServicePort} dependencies.loggerService - Logger service instance for authentication logging
 * @param {TokenServicePort} dependencies.jwtService - JWT service for token verification
 * @returns {Function} Express middleware function for JWT authentication
 */
const createAuthenticationMiddleware = ({ userRepository, loggerService, jwtService }) => {
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
    const user = await userRepository.findById(userId);

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
