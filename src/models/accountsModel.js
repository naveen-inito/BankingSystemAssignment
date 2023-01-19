const { pool } = require('../db/connection');

const insertIntoAccounts = async (accountNumber, accountType, userId, formattedDate, amount) => {
  const result = await pool.query(
    'INSERT INTO accounts ("accountNumber", "accountType", "userId", "createdAt", "balance") values($1,$2,$3,$4,$5)',
    [accountNumber, accountType, userId, formattedDate, amount],
  );
  return result;
};

const fetchUserAccounts = async (userId) => {
  const result = await pool.query(
    'select * from accounts where "userId" = $1',
    [userId],
  );
  return result.rows;
};

const fetchAccountsFromType = async (accountType) => {
  const result = await pool.query(
    'select * from accounts where "accountType" = $1',
    [accountType],
  );
  return result;
};

const fetchAccountDetailsFromIdAndType = async (userId, accountType) => {
  const result = await pool.query(
    `SELECT * FROM accounts
            WHERE "userId" = $1 AND "accountType" = $2`,
    [userId, accountType],
  );
  return result;
};

const deductFromBalance = async (amount, accountNumber, accountType) => {
  const result = await pool.query(
    `UPDATE accounts
              SET balance = balance - $1
              WHERE "accountNumber" = $2 AND "accountType" = $3`,
    [amount, accountNumber, accountType],
  );
  return result;
};

const addToBalance = async (accountNumber, amount, accountType) => {
  const result = await pool.query(
    `UPDATE accounts
              SET balance = balance + $1
              WHERE "accountNumber" = $2 AND "accountType" = $3`,
    [amount, accountNumber, accountType],
  );
  return result;
};

module.exports = {
  insertIntoAccounts,
  fetchUserAccounts,
  fetchAccountDetailsFromIdAndType,
  deductFromBalance,
  addToBalance,
  fetchAccountsFromType,
};
