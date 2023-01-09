const jwt = require('jsonwebtoken');
const { pool } = require('../db/connection');

const authMiddleware = async function (req, res, next) {

    console.log("auth")
    try {

        const secret = "AOCNASDMWFOF"

        const token = req.header('Authorization').split(' ')[1];
        console.log(token)
        // const decoded = jwt.verify(token, process.env.secret);
        const decoded = jwt.verify(token, secret);
        console.log(JSON.stringify(decoded))
        const result = await pool.query(
            // 'select b.id,b.email,t.access_token from bank_user b inner join tokens t on b.userid=t.userid where t.access_token=$1 and t.userid=$2',
            // [token, decoded.userid]
            'SELECT id from bank_user where token = $1 AND email = $2',
            [token, decoded.email]
        );
        const user = result.rows[0];
        if (user) {
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