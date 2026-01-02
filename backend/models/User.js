const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const {
  NAME_MIN_LENGTH,
  NAME_MAX_LENGTH,
  PASSWORD_MIN_LENGTH_MODEL,
  LASTNAME_MAX_LENGTH,
  LOCATION_MAX_LENGTH,
  BCRYPT_SALT_ROUNDS,
} = require('../constants');

/**
 * Creates a Mongoose schema for User documents
 * @param {Object} options - Configuration options for the schema
 * @param {boolean} options.autoIndex - Whether to automatically build indexes
 * @returns {mongoose.Schema} The configured User schema
 */
const createUserSchema = ({ autoIndex }) => {
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

  UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
      return;
    }
    const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  });

  UserSchema.methods.comparePassword = async function (candidatePassword) {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
  };

  return UserSchema;
};
module.exports = { createUserSchema };
