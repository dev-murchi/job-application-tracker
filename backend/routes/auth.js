const express = require('express');
const authController = require('../controllers/auth');
const { UserRegisterSchema, UserLoginSchema } = require('../utils/validation');
const config = require('../config');
const { validateBody } = require('../middleware/validator');

const router = express.Router();

if (config.isProduction) {
  const { authRouteRateLimit } = require('../middleware/rate-limiter');
  router.use(authRouteRateLimit);
}

router.post('/register', validateBody(UserRegisterSchema), authController.register);

router.post('/login', validateBody(UserLoginSchema), authController.login);

router.get('/logout', authController.logout);

module.exports = router;
