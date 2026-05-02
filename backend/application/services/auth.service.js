const { BadRequestError, UnauthenticatedError } = require('../../shared/errors');
const { crateUserDTO } = require('../../shared/dtos/user.dto');

/**@typedef { import('../../shared/dtos/user.dto').UserDTO } UserDTO */
/**@typedef { import('../../shared/dtos/auth.dto').RegisterUserInputDTO } RegisterUserInputDTO */
/**@typedef { import('../../shared/dtos/auth.dto').AuthResult } AuthResult */
/**@typedef { import('../../shared/dtos/auth.dto').AuthCredentials } AuthCredentials */
/**@typedef { import('../ports/driving/auth.service.port').AuthServicePort } AuthServicePort */
/**@typedef { import('../ports/driven/database/user.repository.port').UserRepositoryPort } UserRepositoryPort */
/**@typedef { import('../ports/driven/security/token.service.port').TokenServicePort } TokenServicePort */
/**@typedef { import('../ports/driven/crypto/crypto.service.port').CryptoServicePort } CryptoServicePort */

/**
 * Factory function to create auth service with injected dependencies
 * @param {Object} dependencies - Dependency object
 * @param {UserRepositoryPort} dependencies.userRepository - User database repository
 * @param {TokenServicePort} dependencies.jwtService - JWT service for token operations
 * @param {CryptoServicePort} dependencies.cryptoService - Password hashing service
 * @returns {AuthServicePort} Auth service methods
 */
const createAuthService = ({ userRepository, jwtService, cryptoService }) => {
  /**
   * Register a new user
   * @param {RegisterUserInputDTO} userData - User registration data
   * @returns {UserDTO} Formatted user data
   * @throws {BadRequestError} If email already exists
   */
  const registerUser = async (userData) => {
    const { name, lastName, email, password, location } = userData;

    const userAlreadyExists = await userRepository.findByEmail(email);

    if (userAlreadyExists) {
      throw new BadRequestError('Email already in use');
    }

    const hashedPassword = await cryptoService.hash(password);

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
   * @param {AuthCredentials} credentials - Login credentials
   * @returns {AuthResult} User data and JWT token
   * @throws {UnauthenticatedError} If credentials are invalid
   */
  const authenticateUser = async (credentials) => {
    const { email, password } = credentials;

    const user = await userRepository.findByEmailWithPassword(email);

    if (!user) {
      throw new UnauthenticatedError('Invalid Credentials');
    }

    const isPasswordCorrect = await cryptoService.compare(password, user.password);

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
