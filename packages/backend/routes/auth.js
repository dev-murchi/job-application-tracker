const express = require('express');
const authController = require('../controllers/auth');
const rateLimit = require('express-rate-limit');
const { validateData, UserRegisterationSchema, UserLoginSchema } = require('../middleware/validation');
const config = require('../config');

const router = express.Router();

if (config.isProduction) {
  const { authRouteRateLimit } = require('../middleware/rate-limiter');
  router.use(authRouteRateLimit);
}

router.post('/register', (req, res, next) => {
  req.body = validateData(UserRegisterationSchema, req.body);
  next();
}, authController.register);

router.post('/login', (req, res, next) => {
  req.body = validateData(UserLoginSchema, req.body);
  next();
}, authController.login);

router.get('/logout', authController.logout);

module.exports = router;
