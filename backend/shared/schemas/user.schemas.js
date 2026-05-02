const { z } = require('zod');
const {
  NAME_MIN_LENGTH,
  NAME_MAX_LENGTH,
  LASTNAME_MAX_LENGTH,
  LOCATION_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
} = require('../constants');

/**
 * User profile update validation schema
 * All fields are optional to support partial updates
 */
const UserUpdateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(NAME_MIN_LENGTH, `Name must be at least ${NAME_MIN_LENGTH} characters`)
      .max(NAME_MAX_LENGTH, `Name must be at most ${NAME_MAX_LENGTH} characters`)
      .optional(),
    lastName: z
      .string()
      .trim()
      .min(1, 'Last name is required')
      .max(LASTNAME_MAX_LENGTH, `Last name must be at most ${LASTNAME_MAX_LENGTH} characters`)
      .optional(),
    email: z
      .email('Invalid email format')
      .trim()
      .max(EMAIL_MAX_LENGTH, `Email must be at most ${EMAIL_MAX_LENGTH} characters`)
      .optional(),
    location: z
      .string()
      .trim()
      .min(1, 'Location is required')
      .max(LOCATION_MAX_LENGTH, `Location must be at most ${LOCATION_MAX_LENGTH} characters`)
      .optional(),
  })
  .strict();

module.exports = {
  UserUpdateSchema,
};
