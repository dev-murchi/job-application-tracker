const { z } = require('zod');
const { NAME_MIN_LENGTH } = require('../constants');

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
      .optional(),
    lastName: z.string().trim().min(1, 'Last name is required').optional(),
    email: z.email('Invalid email format').optional(),
    location: z.string().trim().min(1, 'Location is required').optional(),
  })
  .strict();

module.exports = {
  UserUpdateSchema,
};
