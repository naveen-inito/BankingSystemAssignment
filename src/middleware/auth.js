const jwt = require('jsonwebtoken');
const { pool } = require('../db/connection');
const dotenv = require('dotenv');
dotenv.config();
const secret = process.env.SECRET;

const authMiddleware = async function (req, res, next) {

    try {

        const token = req.header('Authorization').split(' ')[1];

        const decoded = jwt.verify(token, secret);

        const result = await pool.query(
            'SELECT id, username from bank_user where username = $1',
            [decoded.username]
        );

        const user = result.rows[0];
        if (user && req.body.username==decoded.username) {
            req.user = user;
            req.token = token;
            next();
        } else {
            throw new Error('Error while authentication');
        }
    } catch (error) {
        res.status(400).send({
            auth_error: 'Authentication failed.'
        });
    }
};


module.exports = authMiddleware;