const { pool } = require('../db/connection');

const getCardDetails = async (cardNumber) => {
  const result = await pool.query(
    `SELECT * FROM atm_card
        WHERE "cardNumber" = $1 LIMIT 1`,
    [cardNumber],
  );
  return result.rows[0];
};

const fetchCardDetailsFromAccountNumber = async (accountNumber) => {
  const result = await pool.query(
    `SELECT * FROM atm_card
        WHERE "accountNumber" = $1 LIMIT 1`,
    [accountNumber],
  );
  return result.rows[0];
};

module.exports = {
  getCardDetails,
  fetchCardDetailsFromAccountNumber,
};
