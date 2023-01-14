const { pool } = require("../db/connection");
const { getUserAccountDetails } = require("../utils/common");


const getUserAccount = async (user_id, account_type) => {
    const result = await pool.query(
        'select * from accounts where user_id = $1 AND account_type = $2',
        [user_id, account_type]
    );
    const account_row = result.rows[0];   
}

const accountEntry = async (account_number, account_type, user_id, formattedDate, amount) => {
    const result = await pool.query(
        'INSERT INTO accounts (account_number, account_type, user_id, created_at, balance) values($1,$2,$3,$4,$5)',
        [account_number, account_type, user_id, formattedDate, amount]
    );
    return result;
}

const createLoanAccount = async (account_number, loan_type, loan_interest, amount, duration, status) => {
    const result = await pool.query(
        'INSERT INTO loan_account (account_number, loan_type, interest, amount, duration, status) values($1,$2,$3,$4,$5,$6)',
        [account_number, loan_type, loan_interest, amount, duration, 'active']
    );
    return result;
}

const getAllUserAccounts = async (user_id) => {
    const result = await pool.query(
        'select * from accounts where user_id = $1',
        [user_id]
    );
    return result.rows;
}

const getAccountNumber = async (user_id, account_type) => {
    const getAccountNumberQuery = await pool.query(
        `SELECT * FROM accounts
        WHERE user_id = $1 AND account_type = $2`,
        [user_id, account_type]
    )
    return getAccountNumberQuery.rows[0];
}

const getAllTransactionsOfAccount = async (account_number) => {
    const result = await pool.query(
        `SELECT * from transaction
        where account_no = $1`,
        [account_number]
    );
    return result;
}

// ----- LOAN ACCOUNT SERVICES -----------
const getLoanAmountRepayed = async (account_number) => {
    const result = await pool.query(
        `SELECT SUM(amount) FROM transaction WHERE
        account_no = $1 AND transaction_type = $2`,
        [account_number, "LOAN_REPAYMENT"]
    );
    return result.rows[0].sum;
}

const updateLoanStatus = async (account_number, status) => {
    const result = await pool.query(
        `UPDATE loan_account
        set status = $1
        where account_number = $2`,
        [status, account.account_number]
    );
    return result;
}
// --x-- LOAN ACCOUNT SERVICES ----x------


// ----- ATM CARD SERVICES -----------
const verifyCardDetails = async (account_number, card_number, cvv) => {
    const result = await pool.query(
        `SELECT * FROM atm_card
        WHERE account_number = $1
        AND card_number = $2
        AND cvv = $3`,
        [account_number, card_number, cvv]
    )
    return result.rows[0];
}

// --x-- ATM CARD SERVICES ----x------

const getTotalDepositsOfUser = async (user_rows) => {
    var len = user_rows.length;
    var total_sum = 0;
    for(var i=0; i<len; i++){
        total_sum += user_rows.balance;
    }
}

module.exports = {
    getUserAccount,
    getAllUserAccounts,
    getTotalDepositsOfUser,
    createLoanAccount,
    getAccountNumber,
    getAllTransactionsOfAccount,
    getLoanAmountRepayed,
    updateLoanStatus,
    verifyCardDetails
}