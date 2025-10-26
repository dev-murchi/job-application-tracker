const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const config = require('../config');

const NAME_MIN_LENGTH = 3;
const NAME_MAX_LENGTH = 50;
const PASSWORD_MIN_LENGTH = 6;
const LASTNAME_MAX_LENGTH = 20;
const LOCATION_MAX_LENGTH = 20;
const BCRYPT_SALT_ROUNDS = 10;

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
      minlength: PASSWORD_MIN_LENGTH,
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
  { timestamps: true, autoIndex: !config.isProduction },
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

UserSchema.methods.createJWT = function () {
  return jwt.sign({ userId: this._id }, config.jwtSecret, {
    expiresIn: config.jwtLifetime,
  });
};

module.exports = UserSchema;
