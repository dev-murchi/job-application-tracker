const { z } = require('zod');
const { NAME_MIN_LENGTH, PASSWORD_MIN_LENGTH } = require('../constants');

/**
 * User registration validation schema
 * Validates all required fields for creating a new user account
 */
const UserRegisterSchema = z.object({
  name: z
    .string('Name is required')
    .trim()
    .min(NAME_MIN_LENGTH, `Name must be at least ${NAME_MIN_LENGTH} characters`),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.email('Invalid email format'),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`),
  location: z.string().trim().min(1, 'Location is required'),
});

/**
 * User login validation schema
 * Validates email and password for authentication
 */
const UserLoginSchema = z.object({
  email: z.email('Invalid email format').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

module.exports = {
  UserRegisterSchema,
  UserLoginSchema,
};
