const { z } = require('zod');
const mongoose = require('mongoose');
const {
  PAGE_DEFAULT,
  LIMIT_DEFAULT,
  LIMIT_MAX,
  MONGOOSE_OBJECT_ID_LENGTH,
} = require('../constants');

/**
 * Mongoose ObjectId validation schema
 * Validates 24-character hexadecimal strings and ensures they're valid ObjectIds
 */
const MongooseObjectIdSchema = z
  .string()
  .trim()
  .length(MONGOOSE_OBJECT_ID_LENGTH, `ObjectId must be ${MONGOOSE_OBJECT_ID_LENGTH} characters`)
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid ObjectId format',
  });

/**
 * Pagination schema for list queries
 * Provides default values and maximum limits
 */
const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(PAGE_DEFAULT),
  limit: z.coerce.number().int().positive().max(LIMIT_MAX).default(LIMIT_DEFAULT),
});

module.exports = {
  MongooseObjectIdSchema,
  PaginationSchema,
};
