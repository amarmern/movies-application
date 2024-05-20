const mongoose = require('mongoose');
var validator = require('validator');
const bcryptjs = require('bcryptjs');

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
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  //encrypt the password
  this.password = await bcryptjs.hash(this.password, 12);
  this.confirmPassword = undefined;
  next();
});

userSchema.methods.comparePasswordInDb = async function (pswd, pswdDB) {
  return await bcryptjs.compare(pswd, pswdDB);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
