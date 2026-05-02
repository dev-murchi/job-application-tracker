const { z } = require('zod');
const {
  NAME_MIN_LENGTH,
  NAME_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  LASTNAME_MAX_LENGTH,
  LOCATION_MAX_LENGTH,
} = require('../constants');

/**
 * User registration validation schema
 * Validates all required fields for creating a new user account
 */
const UserRegisterSchema = z.object({
  name: z
    .string('Name is required')
    .trim()
    .min(NAME_MIN_LENGTH, `Name must be at least ${NAME_MIN_LENGTH} characters`)
    .max(NAME_MAX_LENGTH, `Name must be at most ${NAME_MAX_LENGTH} characters`),
  lastName: z
    .string()
    .trim()
    .min(1, 'Last name is required')
    .max(LASTNAME_MAX_LENGTH, `Last name must be at most ${LASTNAME_MAX_LENGTH} characters`),
  email: z
    .email('Invalid email format')
    .trim()
    .max(EMAIL_MAX_LENGTH, `Email must be at most ${EMAIL_MAX_LENGTH} characters`),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
    .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters`),
  location: z
    .string()
    .trim()
    .min(1, 'Location is required')
    .max(LOCATION_MAX_LENGTH, `Location must be at most ${LOCATION_MAX_LENGTH} characters`),
});

/**
 * User login validation schema
 * Validates email and password for authentication
 */
const UserLoginSchema = z.object({
  email: z
    .email('Invalid email format')
    .trim()
    .min(1, 'Email is required')
    .max(EMAIL_MAX_LENGTH, `Email must be at most ${EMAIL_MAX_LENGTH} characters`),
  password: z
    .string()
    .min(1, 'Password is required')
    .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters`),
});

module.exports = {
  UserRegisterSchema,
  UserLoginSchema,
};
