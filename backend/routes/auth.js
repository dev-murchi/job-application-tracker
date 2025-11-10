const express = require('express');
const { authController } = require('../controllers');
const { UserRegisterSchema, UserLoginSchema } = require('../utils');
const config = require('../config');
const { validateBody, authRouteRateLimit } = require('../middleware');

const router = express.Router();

if (config.isProduction) {
  router.use(authRouteRateLimit);
}

router.post('/register', validateBody(UserRegisterSchema), authController.register);

router.post('/login', validateBody(UserLoginSchema), authController.login);

router.get('/logout', authController.logout);

module.exports = router;
