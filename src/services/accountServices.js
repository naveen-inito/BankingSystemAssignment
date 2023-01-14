const { pool } = require("../db/connection");
const { generateTransactionNumber } = require("../utils/utils");


const getUserAccount = async (user_id, account_type) => {
    const result = await pool.query(
        'select * from accounts where user_id = $1 AND account_type = $2',
        [user_id, account_type]
    );
    const account_row = result.rows[0];   
    return account_row;
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
        [status, account_number]
    );
    return result;
}

const getUserAccountDetailsOfLoanAccount = async (userId) => {

    const result = await pool.query(
        `SELECT T1.user_id, T2.account_number, T1.created_at, T2.amount, T1.balance, T2.duration, T2.loan_type
        FROM accounts AS T1, loan_account AS T2
        WHERE T1.user_id = $1
        AND T1.account_number = T2.account_number
        `,
        [userId]
    );
    return result;
}

// --x-- LOAN ACCOUNT SERVICES ----x------

const getTransactionCountForAccount = async (account_number, formattedDate) => {

    var d = new Date(formattedDate),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    const result = await pool.query(
        `SELECT COUNT(*)
        FROM transaction
        WHERE account_no = $1
        AND EXTRACT(MONTH FROM date_of_transaction) = $2 AND EXTRACT(YEAR FROM date_of_transaction) = $3`,
        [account_number, month, year]
    )
    return result;
}


const getUserAccountDetailsOfParticularType = async (userId, accountType) => {

    const result = await pool.query(
        `SELECT * FROM accounts WHERE user_id = $1 AND account_type = $2`,
        [userId, accountType]
    );
    return result;
}

const getTotalDepositsOfUser = async (user_rows) => {
    var len = user_rows.length;
    var total_sum = 0;
    for(var i=0; i<len; i++){
        total_sum += user_rows.balance;
    }
}

const subtractMoney = async (account_number, amount, accountType) => {
    const result = await pool.query(
        `UPDATE accounts
        SET balance = balance - $1
        WHERE account_number = $2 AND account_type = $3`,
        [amount, account_number, accountType]
    );
    return result;
}
const subtractMoneyFromLoanAccount = async (account_number, amount) => {
    const result = await pool.query(
        `UPDATE loan_account
        SET amount = amount - $1
        WHERE account_number = $2`,
        [amount, account_number]
    );
    return result;
}

const addMoney = async (account_number, amount, accountType) => {
    const result = await pool.query(
        `UPDATE accounts
        SET balance = balance + $1
        WHERE account_number = $2 AND account_type = $3`,
        [amount, account_number, accountType]
    );
    return result;
}

const getCurrentDayWithdrawalAmount = async (account_number, formattedDate) => {
    var d = new Date(Date.now()),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();
    const result = await pool.query(
        `SELECT SUM(amount) FROM transaction WHERE
        account_no = $1 AND ( transaction_type = $2 OR transaction_type = $3 ) AND
        EXTRACT(DAY FROM date_of_transaction) = $4 AND
        EXTRACT(MONTH FROM date_of_transaction) = $5 AND
        EXTRACT(YEAR FROM date_of_transaction) = $6`,
        [account_number, "WITHDRAW_FROM_ATM",  "WITHDRAW_FROM_BANK", day, month, year]
    );
    return result;
}

const getCurrentMonthAtmWithdrawCount = async (account_number, formattedDate) => {
    var d = new Date(Date.now()),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();
    const result = await pool.query(
        `SELECT * FROM transaction WHERE
        account_no = $1 AND transaction_type = $2 AND
        EXTRACT(MONTH FROM date_of_transaction) = $3 AND
        EXTRACT(YEAR FROM date_of_transaction) = $4`,
        [account_number, "WITHDRAW_FROM_ATM", month, year]
    );
    return result.rows.length;
}

const addTransaction = async (transaction_number, transaction_type, senderAccountNumber, receiverAccountNumber, amount, formattedDate, senderAmountBeforeTransaction, receiverAmountBeforeTransaction) => {

    const sender_transaction_number = generateTransactionNumber();
    const receiver_transaction_number = generateTransactionNumber();


    if(senderAccountNumber!=null){
        // Now, we need to add transaction for the SENDER
        const result = await pool.query(
            'INSERT INTO transaction (transaction_number, transaction_type, account_no, amount, amount_before_transaction) values($1,$2,$3,$4,$5)',
            [sender_transaction_number, transaction_type, senderAccountNumber, -1*amount, senderAmountBeforeTransaction]
        );
        if(receiverAccountNumber==null)
            return result;
    }
    if(receiverAccountNumber!=null){
        // Now, we need to add transaction for the RECEIVER
        const result = await pool.query(
            'INSERT INTO transaction (transaction_number, transaction_type, account_no, amount, amount_before_transaction) values($1,$2,$3,$4,$5)',
            [receiver_transaction_number, transaction_type, receiverAccountNumber, amount, receiverAmountBeforeTransaction]
        );
        return result;
    }
}

const getMinBalance = async (month, year, account_number, balance, number_of_days) => {

    const result = await pool.query(
        `SELECT * FROM transaction
        WHERE account_no = $1
        AND EXTRACT(MONTH FROM date_of_transaction) = $2
        AND EXTRACT(YEAR FROM date_of_transaction) = $3
        ORDER BY date_of_transaction ASC`,
        [account_number, month, year]
    );
    
    const allTransactions = result.rows;
    const transaction_count = allTransactions.length;
    
    const no_of_days = number_of_days;
    var start_day = new Array(no_of_days + 1);
    var final_amount_of_day = new Array(no_of_days + 1);

    // We need to also handle the case when there are no transactions for the given "account_number"
    if(transaction_count==0){
        // Now, we need to just get the balance of the "account_number"
        // And, we can simply put that balance in whole array and return it
        for (var i = 1; i <= no_of_days; i++) {
            final_amount_of_day[i] = balance;
        }
        return final_amount_of_day;
    }

    for (var i = 0; i < transaction_count; i++) {
        const currentTransaction = allTransactions[i];

        const currentDate = currentTransaction.date_of_transaction;

        const Day = currentDate.getDate();

        if(start_day[Day]==undefined){
            start_day[Day] = currentTransaction.amount_before_transaction;
        }
        const amount_after_transaction = currentTransaction.amount_before_transaction + currentTransaction.amount;
        final_amount_of_day[Day] = amount_after_transaction;
    }

    for (var i = 1; i <= no_of_days; i++) {
        if(final_amount_of_day[i]!=undefined){
            
            // go back until we find null
            var j = i-1;
            while(j>0 && (final_amount_of_day[j]==undefined || final_amount_of_day[j]==null)){
                final_amount_of_day[j] = start_day[i];
                j--;
            }

            // go to front until we find null
            j = i+1;
            while(j<=no_of_days && (final_amount_of_day[j]==undefined || final_amount_of_day[j]==null)){
                final_amount_of_day[j] = final_amount_of_day[i];
                j++;
            }
        }
    }
    return final_amount_of_day;
}

const getMinBalanceOfLoanAccount = async (startDate, endDate, numberOfDays, account_number, balance) => {

    const result = await pool.query(
        `SELECT * FROM transaction
        WHERE account_no = $1
        AND date_of_transaction >= $2
        AND date_of_transaction <= $3
        ORDER BY date_of_transaction ASC`,
        [account_number, startDate, endDate]
    );
    
    const allTransactions = result.rows;
    const transaction_count = allTransactions.length;

    const no_of_days = numberOfDays;
    var start_day = new Array(no_of_days + 1);
    var final_amount_of_day = new Array(no_of_days + 1);

    // We need to also handle the case when there are no transactions for the given "account_number"
    if(transaction_count==0){
        // Now, we need to just get the balance of the "account_number"
        // And, we can simply put that balance in whole array and return it
        for (var i = 1; i <= no_of_days; i++) {
            final_amount_of_day[i] = balance;
        }
        return final_amount_of_day;
    }

    for (var i = 0; i < transaction_count; i++) {
        const currentTransaction = allTransactions[i];

        const currentDate = currentTransaction.date_of_transaction;

        const Day = await getNumberOfDays(startDate, currentDate)

        if(start_day[Day]==undefined){
            start_day[Day] = currentTransaction.amount_before_transaction;
        }
        const amount_after_transaction = currentTransaction.amount_before_transaction + currentTransaction.amount;
        final_amount_of_day[Day] = amount_after_transaction;
    }

    for (var i = 1; i <= no_of_days; i++) {
        if(final_amount_of_day[i]!=undefined){
            
            // go back until we find null
            var j = i-1;
            while(j>0 && (final_amount_of_day[j]==undefined || final_amount_of_day[j]==null)){
                final_amount_of_day[j] = start_day[i];
                j--;
            }

            // go to front until we find null
            j = i+1;
            while(j<=no_of_days && (final_amount_of_day[j]==undefined || final_amount_of_day[j]==null)){
                final_amount_of_day[j] = final_amount_of_day[i];
                j++;
            }
        }
    }
    return final_amount_of_day;
}

module.exports = {
    getUserAccount,
    getAllUserAccounts,
    getTotalDepositsOfUser,
    accountEntry,
    createLoanAccount,
    getAccountNumber,
    getAllTransactionsOfAccount,
    getLoanAmountRepayed,
    updateLoanStatus,
    getUserAccountDetailsOfParticularType,
    getUserAccountDetailsOfLoanAccount,
    subtractMoney,
    subtractMoneyFromLoanAccount,
    addMoney,
    addTransaction,
    getCurrentDayWithdrawalAmount,
    getCurrentMonthAtmWithdrawCount,
    getTransactionCountForAccount,
    getMinBalance,
    getMinBalanceOfLoanAccount
}