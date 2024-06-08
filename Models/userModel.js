const mongoose = require('mongoose');
var validator = require('validator');
const bcryptjs = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter your name.'],
  },
  email: {
    type: String,
    required: [true, 'Please enter an email.'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please enter a valid email.'],
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'admin', 'test1', 'test2'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please enter a password.'],
    minlength: 8,
    select: false, // in response need to hide the password
  },
  confirmPassword: {
    type: String,
    required: [true, 'Please confirm your password.'],
  },
  // validate: {
  //   // this validator will work for save and update
  //   validator: function (val) {
  //     return val == this.password;
  //   },
  //   message: 'password and consfirm password does not match',
  // },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetTokenExpire: Date,
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  //encrypt the password
  this.password = await bcryptjs.hash(this.password, 12);
  this.confirmPassword = undefined;
  next();
});

// for getting only active all users
userSchema.pre(/^find/, function (next) {
  //this keyword in the function will point to current query
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.comparePasswordInDb = async function (pswd, pswdDB) {
  return await bcryptjs.compare(pswd, pswdDB);
};

userSchema.methods.isPasswordChanged = async (JWTTimestamp) => {
  if (this.passwordChangedAt) {
    const passwordChangedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000
    );
    console.log(passwordChangedTimeStamp, JWTTimestamp);
    // password changed should before date..
    return JWTTimestamp < passwordChangedTimeStamp;
  }
  return false;
};

userSchema.methods.createResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(64).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetTokenExpire = Date.now() + 10 * 60 * 1000;

  console.log(resetToken, this.passwordResetToken);

  return resetToken;
};
const User = mongoose.model('User', userSchema);

module.exports = User;
