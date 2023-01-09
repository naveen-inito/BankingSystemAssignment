const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db/connection');

// const {validateUser, isInvalidField, generateAuthToken} = require('../utils/common');
const {validateUser, generateAuthToken} = require('../utils/common');
const authMiddleware = require('../middleware/auth');
const { getUserId } = require('../utils/utilities');

const Router = express.Router();

Router.post('/create_user', async (req, res) => {
    try {
        const { username, name, email, password, phone_no, dob, address} = req.body;

        console.log(`${username}, ${name}, ${email}, ${password}, ${phone_no}, ${dob}, ${address}`);


        // console.log(req.body, "<--");
        // const validFieldsToUpdate = [
        //     'username',
        //     'name',
        //     'email',
        //     'password',
        //     'phone_no',
        //     'dob',
        //     'address'
        // ];
        // const receivedFields = Object.keys(req.body);

        // const isInvalidFieldProvided = isInvalidField(receivedFields,validFieldsToUpdate);
        // if (isInvalidFieldProvided) {
        //     return res.status(400).send({
        //         signup_error: 'Invalid field.'
        //     });
        // }

        // regex for validating phone number
        // https://stackoverflow.com/questions/4338267/validate-phone-number-with-javascript
        // /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im

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
        res.status(201).send();
    } catch (error) {
        res.status(400).send({
            signup_error: 'Error while signing up..Try again later.'
        });
        console.error(error, "<-error");
    }
});


Router.post('/log_in', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await validateUser(email, password);
        console.log(user, "<< from auth file 2");
        if (!user) {
            res.status(400).send({
                sigin_error: 'Email/password does not match.'
            });
        }

        // NOW, the user is already validated

        // handle the case when user is already logged in

        const token = await generateAuthToken(user);
        // console.log(token, " <- token");
        
        // Now we need to enter this token in the "token" column in "bank_user" table
        user.token = token;
        const result = await pool.query(
            'UPDATE bank_user SET token = $1 WHERE email = $2 returning *',
            [token, email]
        );

        if (!result.rows[0]) {
            return res.status(400).send({
                signin_error: 'Error while signing in..Try again later.'
            });
        }
        // user.token = result.rows[0].access_token;
        res.send(user);
    } catch (error) {
        console.log(error+" <- error");
        res.status(400).send({
            signin_error: 'Email/password does not matching.'
        });
    }
});



Router.post('/log_out', authMiddleware, async (req, res) => {
    try {
        const { userid, access_token } = req.user;
        await pool.query('delete from tokens where userid=$1 and access_token=$2', [
            userid,
            access_token
        ]);
        res.send();
    } catch (error) {
        res.status(400).send({
            logout_error: 'Error while logging out..Try again later.'
        });
    }
});

module.exports = Router;