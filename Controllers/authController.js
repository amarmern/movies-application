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

exports.forgotPassword = asyncErrorHandler(async (req, res, next) => {
  //1. GET USER BASED ON POSTED EMAIL
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    const error = new CustomError(
      'We could not find the user with given email',
      400
    );
    next(error);
  }
  //2. GENERATE A RANDOM RESET TOKEN
  const resetToken = user.createResetPasswordToken();

  await user.save({ validateBeforeSave: false });
  //3.SEND THE TOKEN BACK TO THE USER EMAIL
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;
  const message = `We have recieved a password a reset request. Please use the below link to reset password\n\n${resetUrl}\n\nThis Password link will be valid for 10 minutes.`;
  try {
    await sendEmail({
      email: user.email,
      subject: `Password change request recieved`,
      message: message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Password reset link to send to the user email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpire = undefined;
    user.save({ validateBeforeSave: false });

    return next(
      new CustomError(
        'There was an error sending password reset email. Please try again later.',
        500
      )
    );
  }
});

exports.resetPassword = asyncErrorHandler(async (req, res, next) => {
  //1. IF THE USER EXISTS WITH THE GIVEN TOKEN & PASSWORD HAS NOT EXPIRED
  const token = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetTokenExpire: { $gt: Date.now() },
  });

  if (!user) {
    const error = new CustomError('Token is invalid or has expired!', 400);
    next(error);
  }

  //2. RESETING THR PASSWORD
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpire = undefined;
  user.passwordChangedAt = Date.now();

  user.save();

  //3. LOGIN THE USER AUTOMITACALLY AFTER RESET THE PASSWORD
  const loginToken = signToken(user._id);

  res.status(200).json({
    status: 'success',
    token: loginToken,
  });
});

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
