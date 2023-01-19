/* eslint-disable max-len */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const dotenv = require('dotenv');
const { getUserId } = require('../utils/utils');
const { validateSignUp } = require('../validation/users');
const { fetchUserDetails, fetchIdAndPasswordOfUser, insertIntoUsers } = require('../models/userModel');

dotenv.config();
const secret = process.env.SECRET;

const getUserDetails = async (id) => {
  const user = await fetchUserDetails(id);
  return user;
};

const validateUser = async (id, password) => {
  const user = await fetchIdAndPasswordOfUser(id);
  if (user) {
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      return user;
    }
  } else {
    throw new Error();
  }
};

const registerUser = async ({
  username, name, email, password, phoneNo, dob, address,
}) => {
  try {
    const userId = getUserId(username);
    const hashedPassword = await bcrypt.hash(password, 8);
    const result = await insertIntoUsers(userId, username, name, email, hashedPassword, phoneNo, dob, address);
    if (result.rowCount === 1) {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};

const generateAuthToken = async (user) => {
  const { id } = user;
  const token = await jwt.sign(
    { id },
    secret,
    {
      expiresIn: '12h',
    },
  );
  return token;
};

const signUpUser = async (req) => {
  const {
    username, name, email, password, phoneNo, dob, address,
  } = req;
  req.id = getUserId(username);
  const user = {
    id: req.id, username: req.username, name: req.name, email: req.email, password: req.password, phoneNo: req.phoneNo, dob: req.dob, address: req.address,
  };
  const validateSignUpResponse = await validateSignUp(user);
  if (!validateSignUpResponse.success) { return validateSignUpResponse; }

  const registerUserResult = await registerUser({
    username, name, email, password, phoneNo, dob, address,
  });
  if (registerUserResult) {
    return ({
      success: true,
      message: 'User created',
    });
  }
  return ({
    success: false,
    message: 'User could not be created',
  });
};

const signInUser = async (req) => {
  const { username, password } = req;
  req.id = getUserId(username);
  const { id } = req;
  const user = await validateUser(id, password);
  if (!user) {
    return {
      success: false,
      message: 'username/password does not match.',
    };
  }
  // NOW, the user is already validated

  const token = await generateAuthToken(user);
  user.token = token;
  delete user.password;
  user.success = true;
  return ({ success: user.success, id: user.id, token: user.token });
};

module.exports = {
  signUpUser,
  signInUser,
  registerUser,
  generateAuthToken,
  getUserDetails,
  validateUser,
};
