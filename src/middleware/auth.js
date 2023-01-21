const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { pool } = require('../db/connection');
const { fetchIdAndPasswordOfUser } = require('../models/userModel');

dotenv.config();
const secret = process.env.SECRET;

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization').split(' ')[1];
    const decoded = jwt.verify(token, secret);

    const user = fetchIdAndPasswordOfUser(decoded.id);

    if (user) {
      req.body.id = decoded.id;
      // req.body.token = token;
      next();
    } else {
      throw new Error('Error while authentication');
    }
  } catch (error) {
    res.status(400).send({
      auth_error: 'Authentication failed.',
    });
  }
};

module.exports = authMiddleware;
