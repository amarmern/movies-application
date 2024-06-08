const User = require('../Models/userModel');
const asyncErrorHandler = require('../Utils/asyncErrorHandler');
const jwt = require('jsonwebtoken');
const CustomError = require('../Utils/CustomError');
const util = require('util');
const sendEmail = require('../Utils/email');
const crypto = require('crypto');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.SECRET_STR, {
    expiresIn: process.env.LOGIN_EXPIRES,
  });
};

const filterReqObject = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((prop) => {
    if (allowedFields.includes(prop)) {
      newObj[prop] = obj[prop];
    }
  });
  return newObj;
};

exports.updatePassword = asyncErrorHandler(async (req, res, next) => {
  //GET CURRENT USER DATAT FROM DATABASE
  const user = await User.findById(req.user._id).select('+password');
  //CHECK IF THE SUPPLIED CURRENT PASSWORD IS CORRECT
  if (
    !(await user.comparePasswordInDb(req.body.currentPassword, user.password))
  ) {
    return next(
      new CustomError('The cuurent password you provided is wrong', 401)
    );
  }
  //IF SUPPLIED PASSWORD IS CORRECT, UPDATE USER PASSWORD WITH NEW VALUE

  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;

  await user.save();

  //LOGIN USER & SEND JWT
  const token = signToken(user._id);
  res.status(200).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
});

exports.updateMe = asyncErrorHandler(async (req, res, next) => {
  //1.CHECK IF REQEST DATA CONTAINS PASSWORD || CONFIRM PASSWORD

  if (req.body.password || req.body.confirmPassword) {
    return next(
      new CustomError(
        'You cannot update your password using this endpoint',
        400
      )
    );
  }
  //2.UPDATE THE USER DETAILS
  const filterObj = filterReqObject(req.body, 'name', 'email');
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filterObj, {
    runValidators: true,
    new: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = asyncErrorHandler(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
