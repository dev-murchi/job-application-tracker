const jwt = require('jsonwebtoken');
const { UnauthenticatedError } = require('../errors');

const authenticateUser = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    throw new UnauthenticatedError('Authentication Invalid');
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: payload.userId };
    next();
  } catch (error) {
    throw new UnauthenticatedError('Authentication Invalid');
  }
};

module.exports = authenticateUser;
