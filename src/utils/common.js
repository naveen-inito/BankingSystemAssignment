const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db/connection');
const path = require("path")
require('dotenv').config(path.join(__dirname, "../.env"))
// require('dotenv').config("../.env")

// const isInvalidField = (receivedFields, validFieldsToUpdate) => {
//     return receivedFields.some(
//         (field) => validFieldsToUpdate.indexOf(field) === -1
//     );
// };

const getUserDetails = async (user_id) => {
    const result = await pool.query(
        'select * from bank_user where id = $1',
        [user_id]
    );

    const user = result.rows[0];

    console.log(`${user_id} -> ${JSON.stringify(user)}`);

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

    // const accounts = result.rows[0];
    // return accounts;
    // if (accounts) {
    //     return accounts;
    // } else {
    //     console.log("not found");
    //     throw new Error();
    // }
}

const getUserAccountDetailsOfParticularType = async (userId, accountType) => {

    const result = await pool.query(
        `SELECT * FROM accounts WHERE user_id = $1 AND account_type = $2`,
        [userId, accountType]
    );
    return result;
}

const validateUser = async (email, password) => {
    const result = await pool.query(
        'select id, email, password from bank_user where email = $1',
        [email]
        // `select id, email, password from bank_user where email = ${email}`
    );
    const user = result.rows[0];
    // console.log(password, ", ", user.password, ", ", email);
    console.log(password, ", ", email);
    console.log(user, " << user details from common file");
    if (user) {
        const isMatch = await bcrypt.compare(password, user.password);
        console.log(`isMatch -> ${isMatch}`);
        if (isMatch) {
            // delete user.password;
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
    const { userid, email } = user;

    // HAVING PROBLEM USING ENV VARIABLES IN THIS FILE
    // const secret = process.env.secret;
    const secret = "AOCNASDMWFOF";
    console.log(path.join(__dirname, "../.env") + " << path to env file");
    // console.log({path: __dirname + '/.env' }+" env")
    // console.log(process.env.SECRET_KEY+" <- SECRET KEY ", secret);

    const token = await jwt.sign(
        { userid, email },
        secret,
        // env("SECRET_KEY"),
        {
            expiresIn: "2h",
        }
    );
    return token;
};



const addTransaction = async (transaction_number, transaction_type, sender_user_id, receiverUserId, senderAccountNumber, receiverAccountNumber, amount) => {
    const result = await pool.query(
        'INSERT INTO transaction (transaction_number, transaction_type, sender_user_id, reciever_user_id, sender_account_no, reciever_account_no, amount) values($1,$2,$3,$4,$5,$6,$7)',
        [transaction_number, transaction_type, sender_user_id, receiverUserId, senderAccountNumber, receiverAccountNumber, amount]
    );
    return result;
}

const generate_account_no = (length) => {
    var character_set1 = "123456789";
    var result1 = makeid(1, character_set1);

    var character_set2 = "0123456789";
    var result2 = makeid(length - 1, character_set2);

    var result = result1 + result2;
    // we can also check here that the account number created is also unique

    return result;
}

const subtractMoney = async (account_number, amount, accountType) => {
    if (accountType == "CURRENT") {
        const result = await pool.query(
            `UPDATE current_account
            SET balance = balance - $2
            WHERE account_number = $1`,
            [account_number, amount]
        );
        return result;
    } else if (accountType == "SAVINGS") {
        const result = await pool.query(
            `UPDATE savings_account
            SET balance = balance - $2
            WHERE account_number = $1`,
            [account_number, amount]
        );
        return result;
    }
}

const addMoney = async (account_number, amount, accountType) => {

    if (accountType == "CURRENT") {
        const result = await pool.query(
            `UPDATE current_account
            SET balance = balance + $2
            WHERE account_number = $1`,
            [account_number, amount]
        );
        return result;
    } else if (accountType == "SAVINGS") {
        const result = await pool.query(
            `UPDATE savings_account
            SET balance = balance + $2
            WHERE account_number = $1`,
            [account_number, amount]
        );
        return result;
    }
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

module.exports = {
    // isInvalidField,
    validateUser,
    generateAuthToken,
    getUserDetails,
    generate_account_no,
    getUserAccountDetails,
    getUserAccountDetailsOfParticularType,
    subtractMoney,
    addMoney,
    generateTransactionNumber,
    addTransaction
};