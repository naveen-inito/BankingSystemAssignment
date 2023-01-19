/* eslint-disable max-len */
const { pool } = require('../db/connection');

const insertIntoLoanAccounts = async (accountNumber, loanType, loanInterest, amount, duration, status) => {
  const result = await pool.query(
    'INSERT INTO loan_account ("accountNumber", "loanType", "interest", "amount", "duration", "status") values($1,$2,$3,$4,$5,$6)',
    [accountNumber, loanType, loanInterest, amount, duration, status],
  );
  return result;
};

const fetchActiveLoanAccounts = async () => {
  const result = await pool.query(
    `select *
          FROM accounts AS T1, loan_account AS T2
          WHERE T1."accountNumber" = T2."accountNumber"
          AND T1."accountType" = 'LOAN'
          AND T2.status = 'active'`,
  );
  return result;
};

const fetchActiveLoanAccountsFromAccountNumber = async (accountNumber) => {
  const result = await pool.query(
    `select *
          FROM accounts AS T1, loan_account AS T2
          WHERE T1."accountNumber" = T2."accountNumber"
          AND T1."accountNumber" = $1
          AND T1."accountType" = 'LOAN'
          AND T2.status = 'active'`,
    [accountNumber],
  );
  return result;
};

const loanAccountStatus = async (accountNumber, status) => {
  const result = await pool.query(
    `UPDATE loan_account
              set status = $1
              where "accountNumber" = $2`,
    [status, accountNumber],
  );
  return result;
};

const getLastInterestAddedDates = async (accountNumber) => {
  const result = await pool.query(
    `select *
    FROM transaction
    WHERE "accountNo" = $1
    AND "transactionType" = 'LOAN_INTEREST_ADDED'
    ORDER BY "dateOfTransaction" DESC`,
    [accountNumber],
  );
  return result;
};

const getLoanAccountDetails = async (userId) => {
  const result = await pool.query(
    `SELECT *
              FROM accounts AS T1, loan_account AS T2
              WHERE T1."userId" = $1
              AND T1."accountNumber" = T2."accountNumber"
              `,
    [userId],
  );
  return result;
};

const deductAmountFromLoanAccount = async (accountNumber, amount) => {
  const result = await pool.query(
    `UPDATE loan_account
              SET amount = amount - $1
              WHERE "accountNumber" = $2`,
    [amount, accountNumber],
  );
  return result;
};

module.exports = {
  insertIntoLoanAccounts,
  loanAccountStatus,
  getLoanAccountDetails,
  deductAmountFromLoanAccount,
  fetchActiveLoanAccounts,
  getLastInterestAddedDates,
  fetchActiveLoanAccountsFromAccountNumber,
};
