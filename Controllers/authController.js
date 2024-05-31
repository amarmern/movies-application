const User = require('../Models/userModel');
const asyncErrorHandler = require('../Utils/asyncErrorHandler');
const jwt = require('jsonwebtoken');
const CustomError = require('../Utils/CustomError');
const util = require('util');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.SECRET_STR, {
    expiresIn: process.env.LOGIN_EXPIRES,
  });
};

exports.signup = asyncErrorHandler(async (req, res, next) => {
  const newUser = await User.create(req.body);

  const token = signToken(newUser._id);

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser,
    },
  });
});

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  //check email & password in present request body
  if (!email && !password) {
    const error = new CustomError(
      'Please provide email ID & Password for login!',
      400
    );
    return next(error);
  }

  //check user exists with given email Id
  const user = await User.findOne({ email }).select('+password');
  //const isMatch = await user.comparePasswordInDb(password, user.password);

  //check if user exists & password is matched ?
  if (!user || !(await user.comparePasswordInDb(password, user.password))) {
    const error = new CustomError('Incorrect email or password', 400);
    return next(error);
  }

  const token = signToken(user._id);

  res.status(200).json({
    status: 'success',
    token,
  });
};

exports.protect = asyncErrorHandler(async (req, res, next) => {
  //1. Read the token & check if it exists
  const testToken = req.headers.authorization;
  let token;
  if (testToken && testToken.startsWith('Bearer')) {
    token = testToken.split(' ')[1];
  }
  if (!token) {
    next(new CustomError('You are not looged In!', 401));
  }
  console.log(token);
  //2.validate the token
  const decodedToken = await util.promisify(jwt.verify)(
    token,
    process.env.SECRET_STR
  );
  console.log(decodedToken);
  //3.If the user is exists in db
  const user = await User.findById(decodedToken.id);

  if (!user) {
    const error = new CustomError('The user with given does not exists', 401);
    next(error);
  }

  //4. if the user changed password after the token was issued
  const isPasswordChanged = await user.isPasswordChanged(decodedToken.iat);
  if (isPasswordChanged) {
    const error = new CustomError(
      'The password has changed recently. please login again',
      401
    );
    return next(error);
  }
  //5. Allow user to access the route
  req.user = user;
  next();
});

exports.restrict = (...role) => {
  return (req, res, next) => {
    if (role.includes(req.user.role)) {
      const error = new CustomError(
        'You do not have permission to perform the action',
        403
      );
      next(error);
    }
    next();
  };
};
