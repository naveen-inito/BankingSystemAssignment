const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db/connection');
const path = require("path");
const { formatDate, getNumberOfDays } = require('./utilities');

const dotenv = require('dotenv');
dotenv.config();
const secret = process.env.SECRET;

const getUserDetails = async (user_id) => {
    const result = await pool.query(
        'select * from bank_user where id = $1',
        [user_id]
    );

    const user = result.rows[0];

    if (user) {
        return user;
    } else {
        console.log("not found");
        throw new Error();
    }

}

const getUserAccountDetails = async (receiverUserId) => {

    const result = await pool.query(
        'select * from accounts where user_id = $1',
        [receiverUserId]
    );
    return result;
}

const getUserAccountDetailsOfParticularType = async (userId, accountType) => {

    const result = await pool.query(
        `SELECT * FROM accounts WHERE user_id = $1 AND account_type = $2`,
        [userId, accountType]
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

const getCurrentDayWithdrawAmount = async (account_number, formattedDate) => {

    const result = await pool.query(
        `SELECT * FROM transaction WHERE
        account_number =$1 AND transaction_type = $1 AND date_of_transaction = $3`,
        [account_number, "WITHDRAW_FROM_ATM", formattedDate]
    );
    return result.rows.length;
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

const generate_account_no = (length) => {
    var character_set1 = "123456789";
    var result1 = makeid(1, character_set1);

    var character_set2 = "0123456789";
    var result2 = makeid(length - 1, character_set2);

    var result = result1 + result2;
    return result;
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

const issueAtmCard = async (account_number, currentDate) => {
    const card_number = makeid(16, "0123456789");
    const cvv = makeid(3, "0123456789");

    var d = new Date();
    var year = d.getFullYear();
    var month = d.getMonth();
    var day = d.getDate();
    var expiry_Date = new Date(year + 6, month, day);
    const expiryDate = formatDate(expiry_Date);
    console.log(expiryDate)

    const result = await pool.query(
        'INSERT INTO atm_card (card_number, account_number, expiry_date, cvv) values($1,$2,$3,$4)',
        [card_number, account_number, expiryDate, cvv]
    );
    return result;
}

const makeid = (length, character_set) => {
    var result = "";
    var characters = character_set;
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
};

const generateTransactionNumber = () => {
    const number = BigInt(generate_account_no(15));
    return number;
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
    validateUser,
    generateAuthToken,
    getUserDetails,
    generate_account_no,
    getUserAccountDetails,
    getUserAccountDetailsOfParticularType,
    subtractMoney,
    addMoney,
    generateTransactionNumber,
    addTransaction,
    issueAtmCard,
    getCurrentDayWithdrawAmount,
    getCurrentMonthAtmWithdrawCount,
    getCurrentDayWithdrawalAmount,
    subtractMoneyFromLoanAccount,
    getTransactionCountForAccount,
    getMinBalance,
    getUserAccountDetailsOfLoanAccount,
    getMinBalanceOfLoanAccount
};