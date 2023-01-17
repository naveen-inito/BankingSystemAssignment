// eslint-disable-next-line import/no-extraneous-dependencies
const joi = require('joi');
const { getUserId } = require('../utils/utils');
const { pool } = require('../db/connection');
const { userExists } = require('../services/userServices');

const validateSignUpFromJOI = (user) => {
  const singUpSchema = joi.object({
    id: joi.number().required(),
    username: joi.string().min(3).max(40).required(),
    name: joi.string().min(3).max(40).required(),
    email: joi.string().email().required(),
    password: joi.string().min(6).required(),
    phoneNo: joi.string().min(10).required(),
    dob: joi.string().min(6).required(),
    address: joi.string().min(6).required(),
  });
  return !!singUpSchema.validate(user).error;
};

const validateSignUp = async (user) => {
  if (validateSignUpFromJOI(user)) {
    return { success: false, message: 'invalid details' };
  }
  const doesExists = await userExists(user.id);
  if (doesExists) {
    return { success: false, message: 'User already exists' };
  }
  return { success: true, message: 'valid details' };
};

module.exports = {
  validateSignUpFromJOI,
  validateSignUp,
};
