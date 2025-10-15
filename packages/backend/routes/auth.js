const express = require('express');
const authController = require('../controllers/auth');
const rateLimit = require('express-rate-limit');
const { validateData, UserRegisterationSchema, UserLoginSchema } = require('../middleware/validation');
const config = require('../config');

const router = express.Router();

if (config.isProduction) {
  const routerRateLimit = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: 5,
    message:
      'Too many login/register attempts, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
  });

  router.use(routerRateLimit);
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
