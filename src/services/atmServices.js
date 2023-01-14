const { makeid, formatDate } = require("../utils/utils");
const { pool } = require('../db/connection');

const issueAtmCard = async (account_number, currentDate) => {
    const card_number = makeid(16, "0123456789");
    const cvv = makeid(3, "0123456789");

    var d = new Date();
    var year = d.getFullYear();
    var month = d.getMonth();
    var day = d.getDate();
    var expiry_Date = new Date(year + 6, month, day);
    const expiryDate = formatDate(expiry_Date);

    const result = await pool.query(
        'INSERT INTO atm_card (card_number, account_number, expiry_date, cvv) values($1,$2,$3,$4)',
        [card_number, account_number, expiryDate, cvv]
    );
    return result;
}

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


module.exports = {
    issueAtmCard, verifyCardDetails
}