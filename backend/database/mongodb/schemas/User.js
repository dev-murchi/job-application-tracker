const mongoose = require('mongoose');
const validator = require('validator');
const {
  NAME_MIN_LENGTH,
  NAME_MAX_LENGTH,
  PASSWORD_MIN_LENGTH_MODEL,
  LASTNAME_MAX_LENGTH,
  LOCATION_MAX_LENGTH,
} = require('../../../constants');

/**
 * Creates a Mongoose schema for User documents
 * @param {{ configService: object }} deps
 * @returns {mongoose.Schema} The configured User schema
 */
const createUserSchema = ({ configService }) => {
  const autoIndex = !configService.get('isProduction');
  const UserSchema = new mongoose.Schema(
    {
      name: {
        type: String,
        required: [true, 'Please provide name'],
        minlength: NAME_MIN_LENGTH,
        maxlength: NAME_MAX_LENGTH,
        trim: true,
      },
      email: {
        type: String,
        required: [true, 'Please provide email'],
        validate: {
          validator: validator.isEmail,
          message: 'Please provide a valid email',
        },
        unique: true,
      },
      password: {
        type: String,
        required: [true, 'Please provide password'],
        minlength: PASSWORD_MIN_LENGTH_MODEL,
        select: false,
      },
      lastName: {
        type: String,
        trim: true,
        maxlength: LASTNAME_MAX_LENGTH,
      },
      location: {
        type: String,
        trim: true,
        maxlength: LOCATION_MAX_LENGTH,
      },
    },
    { timestamps: true, autoIndex },
  );

  UserSchema.index({ email: 1 }, { unique: true, background: true, name: 'email_unique_idx' });

  UserSchema.index({ email: 1, createdAt: -1 }, { background: true, name: 'email_created_idx' });

  return UserSchema;
};
module.exports = { createUserSchema };
