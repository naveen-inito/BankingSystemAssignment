const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { pool } = require('../db/connection');

dotenv.config();
const secret = process.env.SECRET;

const authMiddleware = async function (req, res, next) {
  try {
    const token = req.header('Authorization').split(' ')[1];
    const decoded = jwt.verify(token, secret);

    const result = await pool.query(
      'SELECT id, username from users where id = $1',
      [decoded.id],
    );

    const user = result.rows[0];
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
