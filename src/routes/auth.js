const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db/connection');

const {validateUser, generateAuthToken} = require('../utils/common');
const authMiddleware = require('../middleware/auth');
const { getUserId } = require('../utils/utilities');

const Router = express.Router();

Router.post('/create_user', async (req, res) => {
    try {
        const { username, name, email, password, phone_no, dob, address} = req.body;
        // console.log(`${username}, ${name}, ${email}, ${password}, ${phone_no}, ${dob}, ${address}`);

        const result = await pool.query(
            'select count(*) as count from bank_user where email=$1',
            [email]
        );
        const count = result.rows[0].count;
        if (count > 0) {
            return res.status(400).send({
                signup_error: 'User with this email address already exists.'
            });
        }

        const userId = getUserId(username);

        const hashedPassword = await bcrypt.hash(password, 8);
        await pool.query(
            'insert into bank_user(id, username, name, email, password, phone_no, dob, address) values($1,$2,$3,$4, $5, $6, $7, $8)',
            [userId, username, name, email, hashedPassword, phone_no, dob, address]
        );
        res.status(201).send({
            message: "User created"
        });
    } catch (error) {
        res.status(400).send({
            signup_error: 'Error while signing up..Try again later.'
        });
        console.error(error, "<-error");
    }
});


Router.post('/log_in', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const user = await validateUser(username, password);
        // console.log(user, "<< from auth file 2");
        if (!user) {
            res.status(400).send({
                sigin_error: 'Email/password does not match.'
            });
        }

        // NOW, the user is already validated

        // handle the case when user is already logged in
        const token = await generateAuthToken(user);
        
        user.token = token;
        delete user.password;
        res.send(user);
    } catch (error) {
        console.log(error+" <- error");
        res.status(400).send({
            signin_error: 'Email/password does not matching.'
        });
    }
});

module.exports = Router;