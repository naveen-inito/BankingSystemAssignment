const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db/connection');

const {validateUser, generateAuthToken, getUserDetails, generate_account_no, getUserAccountDetails, getUserAccountDetailsOfParticularType, addMoney, generateTransactionNumber, addTransaction, issueAtmCard} = require('../utils/common');
const {calculate_age, getUserId, formatDate} = require('../utils/utilities');
const authMiddleware = require('../middleware/auth');

const Router = express.Router();

Router.post('/create_account', authMiddleware, async (req, res) => {
    try {

        const { username, account_type, amount} = req.body;

        const user_id = getUserId(username);

        // Here, it checks if user already exists or not (if not it throws error)
        const user = await getUserDetails(user_id);

        const {id, name, email, phone_no, dob, address} = user;

        // Checking if the same account_type already exists for the current user
        const result = await pool.query(
            'select * from accounts where user_id = $1 AND account_type = $2',
            [user_id, account_type]
        );

        const account_row = result.rows[0];

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

        // Now, creating the user account
        if(account_type === 'SAVINGS'){

            if(amount<10000){
                res.status(200).send({
                    error: "Minimum amount error"
                })
            }
            
            // Now creating the account..
            const result1 = await pool.query(
                'INSERT INTO accounts (account_number, account_type, user_id, created_at, balance) values($1,$2,$3,$4,$5)',
                [account_number, account_type, user_id, formattedDate, amount]
            );

            if (result1.rowCount==0) {
                // Query has not run properly
                res.status(400).send({
                    message: "Unable to open account"
                });
                return;
            }

            // We also need to issue atm card for "SAVINGS" account
            const atmResult = await issueAtmCard(account_number, currentDate);

            if(atmResult.rowCount==0){
                // card is not issued
                res.status(400).send({
                    message: "Unable to open account"
                })
            }

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
                'INSERT INTO accounts (account_number, account_type, user_id, created_at, balance) values($1,$2,$3,$4,$5)',
                [account_number, account_type, user_id, formattedDate, amount]
            );

            if (result1.rowCount==0) {
                // Query has not run properly
                res.status(400).send({
                    message: "Error running query"
                });
                return;
            }
            
        } else if(account_type === 'LOAN') {

            const { loan_type, duration} = req.body;

            // SAVINGS or CURRENT account for the user should exist
            // checking already for the entry of "user_id" in "accounts" table
            // if entry is there, then we can create 'LOAN' account
            const result = await pool.query(
                'select * from accounts where user_id = $1',
                [user_id]
            );

            const user_rows = result.rows;
            const age = 30;

            // Checking all the conditions for creating the loan account
            if(!user_rows[0] || amount<500000 || age<25){
                res.status(200).send({
                    message: "Loan cannot be provided"
                })
                return;
            }

            // Can only give 40% of total deposit as loan
            var len = user_rows.length;
            var total_sum = 0;
            for(var i=0; i<len; i++){
                total_sum += user_rows.balance;
            }
            if(((total_sum*40)/100) < amount){
                res.status(400).send({
                    message: "Loan cannot be provided"
                })
                return;
            }

            // work here on type of loans and amount that user can get, and wants to get
            var loan_interest = 0;
            if(loan_type=="HOME"){
                loan_interest = 7;
            }else if(loan_type=="CAR"){
                loan_interest = 8;
            }else if(loan_type=="PERSONAL"){
                loan_interest = 12;
            }else if(loan_type=="BUSINESS"){
                loan_interest = 15;
            }else{
                res.status(200).send({
                    message: "Loan cannot be provided"
                })
                return;
            }

            // Now creating the account..
            const result1 = await pool.query(
                'INSERT INTO accounts (account_number, account_type, user_id, created_at, balance) values($1,$2,$3,$4,$5)',
                [account_number, account_type, user_id, formattedDate, amount]
            );
            const result2 = await pool.query(
                'INSERT INTO loan_account (account_number, loan_type, interest, amount, duration, status) values($1,$2,$3,$4,$5,$6)',
                [account_number, loan_type, loan_interest, amount, duration, 'active']
            );

            if (result1.rowCount==0 || result2.rowCount==0) {
                // Query has not run properly
                res.status(400).send({
                    message: "Loan cannot be provided"
                });
                return;
            }

        }

        res.status(201).send({
            message: "Account created"
        });

    } catch (error) {
        res.status(400).send({
            signup_error: 'Error while creating the account'
        });
        console.error(error, "<-error");
    }
});


module.exports = Router;