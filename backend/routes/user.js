const express = require('express');
const { userController } = require('../controllers');
const { UserUpdateSchema } = require('../utils');
const { validateBody } = require('../middleware');

const router = express.Router();
router.get('/profile', userController.getCurrentUser);
router.patch('/update', validateBody(UserUpdateSchema), userController.updateUser);

module.exports = router;
