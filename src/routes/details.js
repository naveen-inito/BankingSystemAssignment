const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db/connection');

const {validateUser, generateAuthToken, getUserDetails, generate_account_no, getUserAccountDetails, getUserAccountDetailsOfParticularType, subtractMoney, addMoney, generateTransactionNumber, addTransaction, getUserAccountDetailsOfLoanAccount} = require('../utils/common');
const {calculate_age, getUserId, formatDate} = require('../utils/utilities');
const authMiddleware = require('../middleware/auth');

const Router = express.Router();

Router.get('/get_account_details', authMiddleware, async (req, res) => {
    try {
        const {username} = req.body;
        const user_id = getUserId(username);
        
        const savingAccountDetails = await getUserAccountDetailsOfParticularType(user_id, "SAVINGS");
        const currentAccountDetails = await getUserAccountDetailsOfParticularType(user_id, "CURRENT");
        const loanAccountDetails = await getUserAccountDetailsOfLoanAccount(user_id);

        const saving_account = savingAccountDetails.rows[0];
        const current_account = currentAccountDetails.rows[0];
        const loan_account = loanAccountDetails.rows[0];

        var responseToSend = {
            "Savings": saving_account,
            "Current": current_account,
            "Loan": loan_account
        };

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
        const {username, account_type} = req.body;

        const user_id = getUserId(username);

        const getAccountNumberQuery = await pool.query(
            `SELECT * FROM accounts
            WHERE user_id = $1 AND account_type = $2`,
            [user_id, account_type]
        )

        const aRow = getAccountNumberQuery.rows[0];

        if(!aRow){
            res.status(200).send({
                message: "Account does not exist"
            })
            return;
        }
        
        const account_number = aRow.account_number;

        const result = await pool.query(
            `SELECT * from transaction
            where account_no = $1`,
            [account_number]
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

module.exports = Router;