const { BadRequestError, UnauthenticatedError } = require('../errors');
const { crateUserDTO } = require('../dtos/user.dto');

/**
 * Factory function to create auth service with injected dependencies
 * @param {Object} dependencies - Dependency object
 * @param {Object} dependencies.userRepository - User database repository
 * @param {Object} dependencies.jwtService - JWT service for token operations
 * @param {Object} dependencies.hasherService - Hash service
 * @returns {Object} Auth service methods
 */
const createAuthService = ({ userRepository, jwtService, hasherService }) => {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Object} Formatted user data
   * @throws {BadRequestError} If email already exists
   */
  const registerUser = async (userData) => {
    const { name, lastName, email, password, location } = userData;

    const userAlreadyExists = await userRepository.findByEmail(email);

    if (userAlreadyExists) {
      throw new BadRequestError('Email already in use');
    }

    const hashedPassword = await hasherService.hash(password);

    const user = await userRepository.create({
      name,
      lastName,
      email,
      password: hashedPassword,
      location,
    });

    return crateUserDTO(user);
  };

  /**
   * Authenticate user and generate JWT
   * @param {Object} credentials - Login credentials
   * @returns {Object} User data and JWT token
   * @throws {UnauthenticatedError} If credentials are invalid
   */
  const authenticateUser = async (credentials) => {
    const { email, password } = credentials;

    const user = await userRepository.findByEmailWithPassword(email);

    if (!user) {
      throw new UnauthenticatedError('Invalid Credentials');
    }

    const isPasswordCorrect = await hasherService.compare(password, user.password);

    if (!isPasswordCorrect) {
      throw new UnauthenticatedError('Invalid Credentials');
    }

    const token = jwtService.sign({ userId: user._id });

    return {
      user: crateUserDTO(user),
      token,
    };
  };

  return {
    registerUser,
    authenticateUser,
  };
};

module.exports = {
  createAuthService,
};
