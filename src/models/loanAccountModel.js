/* eslint-disable max-len */
const { pool } = require('../db/connection');
const { LOAN_STATUS, ACCOUNT_TYPES, TRANSACTION_TYPES } = require('../utils/constants');

const fetchActiveLoanAccounts = async () => {
  const result = await pool.query(
    `select *
          FROM accounts AS T1, loan_account AS T2
          WHERE T1."accountNumber" = T2."accountNumber"
          AND T1."accountType" = 'LOAN'
          AND T2.status = $1`,
    [LOAN_STATUS.ACTIVE],
  );
  return result;
};

const fetchActiveLoanAccountsFromAccountNumber = async (accountNumber) => {
  const result = await pool.query(
    `select *
          FROM accounts AS T1, loan_account AS T2
          WHERE T1."accountNumber" = T2."accountNumber"
          AND T1."accountNumber" = $1
          AND T1."accountType" = $2
          AND T2.status = $3
          LIMIT 1`,
    [accountNumber, ACCOUNT_TYPES.LOAN, LOAN_STATUS.ACTIVE],
  );
  return result.rows[0];
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
    AND "transactionType" = $2
    ORDER BY "dateOfTransaction" DESC LIMIT 1`,
    [accountNumber, TRANSACTION_TYPES.LOAN_INTEREST_ADDED],
  );
  return result;
};

const getLoanAccountDetails = async (userId) => {
  const result = await pool.query(
    `SELECT *
              FROM accounts AS T1, loan_account AS T2
              WHERE T1."userId" = $1
              AND T1."accountNumber" = T2."accountNumber"
              LIMIT 1`,
    [userId],
  );
  return result.rows[0];
};

module.exports = {
  loanAccountStatus,
  getLoanAccountDetails,
  fetchActiveLoanAccounts,
  getLastInterestAddedDates,
  fetchActiveLoanAccountsFromAccountNumber,
};
