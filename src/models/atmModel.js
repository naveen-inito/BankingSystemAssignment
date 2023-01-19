const { pool } = require('../db/connection');

const insertIntoATM = async (cardNumber, accountNumber, expiryDate, cvv) => {
  const result = await pool.query(
    'INSERT INTO atm_card ("cardNumber", "accountNumber", "expiryDate", "cvv") values($1,$2,$3,$4)',
    [cardNumber, accountNumber, expiryDate, cvv],
  );
  return result;
};

const getCardDetails = async (cardNumber) => {
  const result = await pool.query(
    `SELECT * FROM atm_card
        WHERE "cardNumber" = $1`,
    [cardNumber],
  );
  return result.rows[0];
};

const fetchCardDetailsFromAccountNumber = async (accountNumber) => {
  const result = await pool.query(
    `SELECT * FROM atm_card
        WHERE "accountNumber" = $1`,
    [accountNumber],
  );
  return result.rows[0];
};

module.exports = {
  insertIntoATM,
  getCardDetails,
  fetchCardDetailsFromAccountNumber,
};
