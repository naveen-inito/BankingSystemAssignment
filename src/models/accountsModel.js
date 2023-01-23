/* eslint-disable max-len */
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
            WHERE "userId" = $1 AND "accountType" = $2 LIMIT 1`,
    [userId, accountType],
  );
  return result.rows[0];
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

const loanAccountEntry = async (
  {
    accountNumber, accountType, id, formattedDate, amount, loanInterest, loanType, duration, loanStatus,
  },
) => {
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const result1 = await client.query(
      'INSERT INTO accounts ("accountNumber", "accountType", "userId", "createdAt", "balance") values($1,$2,$3,$4,$5)',
      [accountNumber, accountType, id, formattedDate, amount],
    );
    if (result1.rowCount === 0) {
      throw new Error();
    }

    const result2 = await client.query(
      'INSERT INTO loan_account ("accountNumber", "loanType", "interest", "amount", "duration", "status") values($1,$2,$3,$4,$5,$6)',
      [accountNumber, loanType, loanInterest, amount, duration, loanStatus],
    );
    if (result2.rowCount === 0) {
      throw new Error();
    }

    await client.query('COMMIT');
    return { status: true, message: 'Account Created' };
  } catch (e) {
    await client.query('ROLLBACK');
    return { status: false, message: 'Unable to open account' };
  } finally {
    client.release();
  }
};

const savingsAccountEntry = async (
  {
    accountNumber, accountType, id, formattedDate, amount, cardNumber, expiryDate, cvv,
  },
) => {
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const result1 = await client.query(
      'INSERT INTO accounts ("accountNumber", "accountType", "userId", "createdAt", "balance") values($1,$2,$3,$4,$5)',
      [accountNumber, accountType, id, formattedDate, amount],
    );
    if (result1.rowCount === 0) { throw new Error(); }

    const result2 = await client.query(
      'INSERT INTO atm_card ("cardNumber", "accountNumber", "expiryDate", "cvv") values($1,$2,$3,$4)',
      [cardNumber, accountNumber, expiryDate, cvv],
    );
    if (result2.rowCount === 0) { throw new Error(); }

    await client.query('COMMIT');
    return { status: true, message: 'Account Created' };
  } catch (e) {
    await client.query('ROLLBACK');
    return { status: false, message: 'Unable to open account' };
  } finally {
    client.release();
  }
};

module.exports = {
  insertIntoAccounts,
  fetchUserAccounts,
  fetchAccountDetailsFromIdAndType,
  deductFromBalance,
  fetchAccountsFromType,
  savingsAccountEntry,
  loanAccountEntry,
};
