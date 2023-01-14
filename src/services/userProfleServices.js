const { pool } = require('../db/connection');
const { getUserId } = require("../utils/utils");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const dotenv = require('dotenv');
dotenv.config();
const secret = process.env.SECRET;

const getUserDetails = async (user_id) => {
    const result = await pool.query(
        'select * from bank_user where id = $1',
        [user_id]
    );

    const user = result.rows[0];
    return user;
}

const validateUser = async (username, password) => {
    const result = await pool.query(
        'select id, username, password from bank_user where username = $1',
        [username]
    );
    const user = result.rows[0];
    if (user) {
        const isMatch = await bcrypt.compare(password, user.password);
        console.log(`isMatch -> ${isMatch}`);
        if (isMatch) {
            return user;
        } else {
            throw new Error();
        }
    } else {
        console.log("not found");
        throw new Error();
    }
};


const userExists = async (email) => {
    const result = await pool.query(
        'select count(*) as count from bank_user where email=$1',
        [email]
    );
    
    const count = result.rows[0].count;
    return count;
}


const registerUser = async ({username, name, email, password, phone_no, dob, address}) => {
    const userId = getUserId(username);
    const hashedPassword = await bcrypt.hash(password, 8);
    await pool.query(
        'insert into bank_user(id, username, name, email, password, phone_no, dob, address) values($1,$2,$3,$4, $5, $6, $7, $8)',
        [userId, username, name, email, hashedPassword, phone_no, dob, address]
    );
}

const generateAuthToken = async (user) => {
    const { id, username } = user;
    const token = await jwt.sign(
        { id, username },
        secret,
        {
            expiresIn: "12h",
        }
    );
    return token;
};


module.exports = {
    userExists,
    registerUser,
    generateAuthToken,
    getUserDetails,
    validateUser
}