/* eslint-disable max-len */
const { pool } = require('../db/connection');

const insertIntoTransaction = async (transactionNumber, transactionType, accountNumber, amount, amountBeforeTransaction) => {
  const result = await pool.query(
    'INSERT INTO transaction ("transactionNumber", "transactionType", "accountNo", "amount", "amountBeforeTransaction") values($1,$2,$3,$4,$5)',
    [transactionNumber, transactionType, accountNumber, amount, amountBeforeTransaction],
  );
  return result;
};

const fetchAllTransactionOfAccount = async (accountNumber) => {
  const result = await pool.query(
    `SELECT * from transaction
          where "accountNo" = $1`,
    [accountNumber],
  );
  return result;
};

const getSumOfAmountFromAccountNoAndTransactionType = async (accountNumber, transactionType) => {
  const result = await pool.query(
    `SELECT SUM(amount) FROM transaction WHERE
              "accountNo" = $1 AND "transactionType" = $2`,
    [accountNumber, transactionType],
  );
  return result.rows[0].sum;
};

const fetchParticularMonthTransactionCountOfAccount = async (accountNumber, month, year) => {
  const result = await pool.query(
    `SELECT COUNT(*)
                FROM transaction
                WHERE "accountNo" = $1
                AND EXTRACT(MONTH FROM "dateOfTransaction") = $2 AND EXTRACT(YEAR FROM "dateOfTransaction") = $3`,
    [accountNumber, month, year],
  );
  return result;
};

const fetchParticularDayWithdrawAmount = async (accountNumber, day, month, year) => {
  const result = await pool.query(
    `SELECT SUM(amount) FROM transaction WHERE
              "accountNo" = $1 AND ( "transactionType" = $2 OR "transactionType" = $3 ) AND
              EXTRACT(DAY FROM "dateOfTransaction") = $4 AND
              EXTRACT(MONTH FROM "dateOfTransaction") = $5 AND
              EXTRACT(YEAR FROM "dateOfTransaction") = $6`,
    [accountNumber, 'WITHDRAW_FROM_ATM', 'WITHDRAW_FROM_BANK', day, month, year],
  );
  return result;
};

const fetchParticularMonthAtmWithdrawCount = async (accountNumber, month, year) => {
  const result = await pool.query(
    `SELECT * FROM transaction WHERE
              "accountNo" = $1 AND "transactionType" = $2 AND
              EXTRACT(MONTH FROM "dateOfTransaction") = $3 AND
              EXTRACT(YEAR FROM "dateOfTransaction") = $4`,
    [accountNumber, 'WITHDRAW_FROM_ATM', month, year],
  );
  return result.rows.length;
};

const fetchParticularMonthTransactions = async (accountNumber, month, year) => {
  const result = await pool.query(
    `SELECT * FROM transaction
              WHERE "accountNo" = $1
              AND EXTRACT(MONTH FROM "dateOfTransaction") = $2
              AND EXTRACT(YEAR FROM "dateOfTransaction") = $3
              ORDER BY "dateOfTransaction" ASC`,
    [accountNumber, month, year],
  );
  return result;
};

const fetchLoanTransactions = async (accountNumber, startDate, endDate) => {
  const result = await pool.query(
    `SELECT * FROM transaction
              WHERE "accountNo" = $1
              AND "dateOfTransaction" >= $2
              AND "dateOfTransaction" <= $3
              ORDER BY "dateOfTransaction" ASC`,
    [accountNumber, startDate, endDate],
  );
  return result;
};

module.exports = {
  fetchAllTransactionOfAccount,
  getSumOfAmountFromAccountNoAndTransactionType,
  fetchParticularMonthTransactionCountOfAccount,
  fetchParticularDayWithdrawAmount,
  fetchParticularMonthAtmWithdrawCount,
  insertIntoTransaction,
  fetchParticularMonthTransactions,
  fetchLoanTransactions,
};
