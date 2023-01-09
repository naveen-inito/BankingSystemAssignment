const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db/connection');

// const {validateUser, isInvalidField, generateAuthToken} = require('../utils/common');
const {validateUser, generateAuthToken, getUserDetails, generate_account_no, getUserAccountDetails, getUserAccountDetailsOfParticularType, addMoney, generateTransactionNumber, addTransaction} = require('../utils/common');
const {calculate_age, getUserId, formatDate} = require('../utils/utilities');
const authMiddleware = require('../middleware/auth');

const Router = express.Router();


// const insert_account = async () => {

// }

Router.post('/create_account', authMiddleware, async (req, res) => {
// Router.post('/create_account', async (req, res) => {
    try {
        console.log("api called");


        const { user_id, account_type, amount} = req.body;

        // Here, it checks if user already exists or not (if not it throws error)
        const user = await getUserDetails(user_id);

        const {id, username, name, email, phone_no, dob, address} = user;

        console.log(`${user_id}, ${account_type}, ${amount}, ${email}, ${phone_no}, ${dob}, ${address}`);

        // Checking if the same account_type already exists for the current user
        const result = await pool.query(
            'select * from accounts where user_id = $1 AND account_type = $2',
            [user_id, account_type]
        );

        const account_row = result.rows[0];
        console.log(JSON.stringify(account_row)+" ////");

        if(account_row){
            // it means this type of account already exists
            res.status(200).send({
                message: "account already exists"
            })
            return;
        }

        // utility to calculate unique account number
        const account_number = BigInt(generate_account_no(15));

        // Calculating the age of user
        const current_age = calculate_age(dob);

        // Checking for other account types, other than given three
        if(account_type!='SAVINGS' && account_type!='CURRENT' && account_type!='LOAN'){
            res.status(200).send({
                error: "Invalid data entered"
            })
            return;
        }

        
        const currentDate = Date(Date.now()).toString();
        const formattedDate = formatDate(currentDate);
        console.log(currentDate+" << ", formattedDate);

        // Now, creating the user account

        if(account_type === 'SAVINGS'){

            if(amount<10000){
                res.status(200).send({
                    error: "Minimum amount error"
                })
            }

            // We also need to issue atm card for "SAVINGS" account


        } else if(account_type === 'CURRENT') {

            if(amount<30000){
                res.status(200).send({
                    error: "Minimum amount error"
                })
                return;
            }

            if(current_age<18){
                res.status(200).send({
                    error: "Minimum age error"
                })
                return;
            }

            // Now creating the account..
            const result1 = await pool.query(
                'INSERT INTO accounts (account_number, account_type, user_id, created_at) values($1,$2,$3,$4)',
                [account_number, account_type, user_id, formattedDate]
            );

            if (result1.rowCount==0) {
                // Query has not run properly
                res.status(400).send({
                    message: "Error running query"
                });
                return;
            }

            // Now creating the current account..
            const result2 = await pool.query(
                'INSERT INTO current_account (account_number, user_id, current_month_transaction_count, balance) values($1,$2,$3,$4)',
                [account_number, user_id, 0, amount]
            );

            if (result2.rowCount==0) {
                res.status(400).send({
                    message: "Error running query"
                });
                return;
            }
            
        } else if(account_type === 'LOAN') {

            // SAVINGS or CURRENT account for the user should exist
            // checking already for the entry of "user_id" in "accounts" table
            // if entry is there, then we can create 'LOAN' account
            const result = await pool.query(
                'select * from accounts where user_id = $1',
                [user_id]
            );

            const user_rows = result.rows[0];
            if(!user_rows){
                // no entry for the user
                res.status(400).send({
                    message: "cannot create account"
                });
                return;
            }

            // Min age limit of 25 for opening loan account
            if(age<18){
                res.status(200).send({
                    error: "Minimum age error"
                })
                return;
            }

            // work here on type of loans and amount that user can get, and wants to get


        }

        res.status(201).send({
            message: "Account created"
        });        

        // result1 = await pool.query(
        //     'select id, email, password from bank_user where email = $1',
        //     [email]
        // );

        // res.status(201).send();
    } catch (error) {
        res.status(400).send({
            signup_error: 'Error while creating the account'
        });
        console.error(error, "<-error");
    }
});









module.exports = Router;