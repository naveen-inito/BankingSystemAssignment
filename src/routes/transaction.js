const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db/connection');

// const {validateUser, isInvalidField, generateAuthToken} = require('../utils/common');
const {validateUser, generateAuthToken, getUserDetails, generate_account_no, getUserAccountDetails, getUserAccountDetailsOfParticularType, subtractMoney, addMoney, generateTransactionNumber, addTransaction} = require('../utils/common');
const {calculate_age, getUserId, formatDate} = require('../utils/utilities');
const authMiddleware = require('../middleware/auth');

const Router = express.Router();


Router.post('/deposit_money', authMiddleware, async (req, res) => {
    try {

        // deposit money facility should is only applicable in "CURRENT" account
        // i.e., user deposits money to his own account

        const {user_id, receiver_username, amount} = req.body;

        // receiver must have the "CURRENT" account
        const receiverUserId = getUserId(receiver_username);
        const receiverDetails = await getUserDetails(receiverUserId);
        
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


Router.post('/withdraw_from_bank', authMiddleware, async (req, res) => {
    try {
        const {id, amount, account_type} = req.body;

        const user_id = id
        // console.log(`${user_id} ${amount} ${account_type} <<<`);
        const accountDetails = await getUserAccountDetailsOfParticularType(user_id, account_type);
        const account = accountDetails.rows[0];

        console.log(account)
        console.log(JSON.stringify(accountDetails))
        console.log(JSON.stringify(account))

        // If receiver does not have "CURRENT" account..
        if(!account){
            res.status(400).send({
                message: "Account does not exist"
            })
            return;
        }
        
        if(account.balance<amount){
            res.status(400).send({
                message: "Amount excedded"
            })
            return;
        }

        // Now, finally deposit money in Receiver's "CURRENT" account
        const subtractMoneyResponse = await subtractMoney(account.account_number, amount, account_type);
        console.log(subtractMoneyResponse);
        console.log(JSON.stringify(subtractMoneyResponse) + "<< response of add money");

        if(subtractMoneyResponse.rowCount==0){
            res.status(400).send({
                message: "Money could not be added"
            });
            return;
        }

        // Now, we also need to keep this transaction in "transaction" table
        const transaction_number = generateTransactionNumber();

        const result = await addTransaction(transaction_number, "WITHDRAW_FROM_BANK", user_id, null, account.account_number, null, amount);

        if (result.rowCount==0) {
            // Query has not run properly
            res.status(400).send({
                message: "Transaction could not be done"
            });
            return;
        }

        res.status(200).send({
            message: "Money withdrawn from bank"
        });
        
    } catch (error) {
        res.status(400).send({
            message: 'Error while withdrawing the money'
        });
        console.error(error, "<-error");
    }
});

Router.post('/withdraw_from_atm', authMiddleware, async (req, res) => {
    try {
        const {id, amount, account_type, card_number, cvv} = req.body;

        const user_id = id
        const accountDetails = await getUserAccountDetailsOfParticularType(user_id, account_type);
        const account = accountDetails.rows[0];

        // const verify = await verifyCardDetails(card_number, cvv);

        console.log(account)
        console.log(JSON.stringify(accountDetails))
        console.log(JSON.stringify(account))

        // If receiver does not have "CURRENT" account..
        if(!account){
            res.status(400).send({
                message: "Account does not exist"
            })
            return;
        }
        
        if(account.balance<amount){
            res.status(400).send({
                message: "Amount excedded"
            })
            return;
        }

        // Now, finally deposit money in Receiver's "CURRENT" account
        const subtractMoneyResponse = await subtractMoney(account.account_number, amount, account_type);
        console.log(subtractMoneyResponse);
        console.log(JSON.stringify(subtractMoneyResponse) + "<< response of add money");

        if(subtractMoneyResponse.rowCount==0){
            res.status(400).send({
                message: "Money could not be added"
            });
            return;
        }

        // Now, we also need to keep this transaction in "transaction" table
        const transaction_number = generateTransactionNumber();

        const result = await addTransaction(transaction_number, "WITHDRAW_FROM_BANK", user_id, null, account.account_number, null, amount);

        if (result.rowCount==0) {
            // Query has not run properly
            res.status(400).send({
                message: "Transaction could not be done"
            });
            return;
        }

        res.status(200).send({
            message: "Money withdrawn from bank"
        });
        
    } catch (error) {
        res.status(400).send({
            message: 'Error while withdrawing the money'
        });
        console.error(error, "<-error");
    }
});

Router.post('/transfer_money', async (req, res) => {
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