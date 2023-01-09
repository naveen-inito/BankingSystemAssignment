const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db/connection');

// const {validateUser, isInvalidField, generateAuthToken} = require('../utils/common');
const {validateUser, generateAuthToken, getUserDetails, generate_account_no, getUserAccountDetails, getUserAccountDetailsOfParticularType, subtractMoney, addMoney, generateTransactionNumber, addTransaction} = require('../utils/common');
const {calculate_age, getUserId, formatDate} = require('../utils/utilities');
const authMiddleware = require('../middleware/auth');

const Router = express.Router();

Router.get('/get_account_details', authMiddleware, async (req, res) => {
    try {
        const {id} = req.body;
        const user_id = id;
        
        const savingAccountDetails = await getUserAccountDetailsOfParticularType(user_id, "SAVINGS");
        const currentAccountDetails = await getUserAccountDetailsOfParticularType(user_id, "CURRENT");
        const loanAccountDetails = await getUserAccountDetailsOfParticularType(user_id, "LOAN");

        const saving_account = savingAccountDetails.rows[0];
        const current_account = currentAccountDetails.rows[0];
        const loan_account = loanAccountDetails.rows[0];

        var responseToSend = {
            "Savings": saving_account,
            "Current": current_account,
            "Loan": loan_account
        };

        // console.log(responseToSend)
        // console.log(JSON.stringify(saving_account))
        // console.log(JSON.stringify(current_account))
        // console.log(JSON.stringify(loan_account))

        res.status(200).send(
            JSON.stringify(responseToSend)
        );
        
    } catch (error) {
        res.status(400).send({
            signup_error: 'Error while fetching account details'
        });
        console.error(error, "<-error");
    }
});

Router.get('/get_passbook', authMiddleware, async (req, res) => {
    try {
        const {id} = req.body;
        const user_id = id;
        
        const result = await pool.query(
            'select * from transaction where sender_user_id = $1 OR reciever_user_id = $2',
            [user_id, user_id]
            // `select id, email, password from bank_user where email = ${email}`
        );
        
        res.status(200).send(
            JSON.stringify(result.rows)
        );
        
    } catch (error) {
        res.status(400).send({
            signup_error: 'Error while fetching account details'
        });
        console.error(error, "<-error");
    }
});


Router.post('/withdraw_from_bank', authMiddleware, async (req, res) => {
    
    try {

        const {user_id, amount, account_type} = req.body;

        console.log(receiverDetails);
        console.log(JSON.stringify(receiverDetails));
        const accountDetails = await getUserAccountDetailsOfParticularType(receiverUserId, "CURRENT");
        const account = accountDetails.rows[0];

        // If receiver does not have "CURRENT" account..
        if(!account){
            res.status(400).send({
                message: "Receiver's accounts does not exist"
            })
        }

        // Now, finally deposit money in Receiver's "CURRENT" account
        const addMoneyResponse = await addMoney(account.account_number, amount, "CURRENT");
        console.log(addMoneyResponse);
        console.log(JSON.stringify(addMoneyResponse) + "<< response of add money");

        if(addMoneyResponse.rowCount==0){
            res.status(400).send({
                message: "Money could not be added"
            });
        }

        // Now, we also need to keep this transaction in "transaction" table
        const transaction_number = generateTransactionNumber();

        const result = await addTransaction(transaction_number, "DEPOSIT", user_id, receiverUserId, null, account.account_number, amount);

        if (result.rowCount==0) {
            // Query has not run properly
            res.status(400).send({
                message: "Transaction could not be done"
            });
            return;
        }

        res.status(200).send({
            message: "Money added"
        });
        
    } catch (error) {
        res.status(400).send({
            signup_error: 'Error while depositing the money'
        });
        console.error(error, "<-error");
    }

});

Router.post('/withdraw_from_atm', async (req, res) => {
    
});

Router.post('/transfer_money', authMiddleware, async (req, res) => {
    try {

        // deposit money facility should is only applicable in "CURRENT" account
        // i.e., user deposits money to his own account

        const {user_id, receiver_username, amount} = req.body;

        const senderUserId = user_id;
        const senderDetails = await getUserDetails(senderUserId);
        const senderAccountDetails = await getUserAccountDetailsOfParticularType(senderUserId, "CURRENT");
        const senderAccount = senderAccountDetails.rows[0];

        // receiver must have the "CURRENT" account
        const receiverUserId = getUserId(receiver_username);
        const receiverDetails = await getUserDetails(receiverUserId);
        const receiverAccountDetails = await getUserAccountDetailsOfParticularType(receiverUserId, "CURRENT");
        const receiverAccount = receiverAccountDetails.rows[0];

        // If receiver does not have "CURRENT" account..
        if(!senderAccount){
            res.status(400).send({
                message: "Sender account does not exist"
            })
        }
        if(!receiverAccount){
            res.status(400).send({
                message: "Receiver account does not exist"
            })
        }
        if(senderAccount.balance<amount){
            res.status(400).send({
                message: "Amount excedded"
            })
        }

        // Withdraw money from Sender's "CURRENT" account
        const subtractMoneyResponse = await subtractMoney(senderAccount.account_number, amount, "CURRENT");
        if(subtractMoneyResponse.rowCount==0){
            res.status(400).send({
                message: "Money could not be transferred"
            });
        }

        // Deposit money in Receiver's "CURRENT" account
        const addMoneyResponse = await addMoney(receiverAccount.account_number, amount, "CURRENT");
        console.log(addMoneyResponse);
        console.log(JSON.stringify(addMoneyResponse) + "<< response of add money");

        if(addMoneyResponse.rowCount==0){
            res.status(400).send({
                message: "Money could not be transferred"
            });
        }

        // Now, we also need to keep this transaction in "transaction" table
        const transaction_number = generateTransactionNumber();

        const result = await addTransaction(transaction_number, "TRANSFER", senderUserId, receiverUserId, senderAccount.account_number, receiverAccount.account_number, amount);

        if (result.rowCount==0) {
            // Query has not run properly
            res.status(400).send({
                message: "Transaction could not be done"
            });
            return;
        }

        res.status(200).send({
            message: "Money transferred"
        });
        
    } catch (error) {
        res.status(400).send({
            signup_error: 'Error while depositing the money'
        });
        console.error(error, "<-error");
    }
});

module.exports = Router;