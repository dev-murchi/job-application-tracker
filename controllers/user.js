const User = require('../models/User.js');
const { StatusCodes } = require('http-status-codes');
const { BadRequestError } = require('../errors/index.js');
const attachCookie = require('../utils/attachCookie.js');

const updateUser = async (req, res) => {
    const { email, name, lastName, location } = req.body;
    if (!email || !name || !lastName || !location) {
        throw new BadRequestError('Please provide all values');
    }
    const user = await User.findOne({ _id: req.user.userId });

    user.email = email;
    user.name = name;
    user.lastName = lastName;
    user.location = location;

    await user.save();

    const token = user.createJWT();
    attachCookie({ res, token });
    res.status(StatusCodes.OK).json({ user, location: user.location });
};

const getCurrentUser = async (req, res) => {
    const user = await User.findOne({ _id: req.user.userId });
    res.status(StatusCodes.OK).json({ user, location: user.location });
};

module.exports = {
    getCurrentUser,
    updateUser
};