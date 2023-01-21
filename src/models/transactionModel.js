/* eslint-disable no-param-reassign */
/* eslint-disable max-len */
const { pool } = require('../db/connection');
const { TRANSACTION_TYPES, LOAN_STATUS } = require('../utils/constants');
const { generateTransactionNumber } = require('../utils/utils');

const insertIntoTransaction = async (transactionNumber, transactionType, accountNumber, amount, amountBeforeTransaction) => {
  const result = await pool.query(
    'INSERT INTO transaction ("transactionNumber", "transactionType", "accountNo", "amount", "amountBeforeTransaction") values($1,$2,$3,$4,$5)',
    [transactionNumber, transactionType, accountNumber, amount, amountBeforeTransaction],
  );
  return result;
};

const fetchAllTransactionOfAccount = async (accountNumber, page = 1, size = 50) => {
  const result = await pool.query(
    `SELECT * from transaction
          where "accountNo" = $1
          ORDER BY "dateOfTransaction" DESC
          LIMIT $2
          OFFSET $3`,
    [accountNumber, size, (page - 1) * size],
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
    [accountNumber, TRANSACTION_TYPES.WITHDRAW_FROM_ATM, TRANSACTION_TYPES.WITHDRAW_FROM_BANK, day, month, year],
  );
  return result;
};

const fetchParticularMonthAtmWithdrawCount = async (accountNumber, month, year) => {
  const result = await pool.query(
    `SELECT COUNT(*) FROM transaction WHERE
              "accountNo" = $1 AND "transactionType" = $2 AND
              EXTRACT(MONTH FROM "dateOfTransaction") = $3 AND
              EXTRACT(YEAR FROM "dateOfTransaction") = $4`,
    [accountNumber, TRANSACTION_TYPES.WITHDRAW_FROM_ATM, month, year],
  );
  return result.rowCount;
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

const transferMoney = async ({
  senderAccountNumber, receiverAccountNumber, amount, accountType, transactionType, transactionCharge,
  senderBeforeTransactionAmount,
  receiverBeforeTransactionAmount,
  senderTransactionNumber,
  receiverTransactionNumber,
}) => {
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const deductBalanceQuery = await client.query(
      `UPDATE accounts
              SET balance = balance - $1
              WHERE "accountNumber" = $2 AND "accountType" = $3`,
      [amount, senderAccountNumber, accountType],
    );

    const addBalanceQuery = await client.query(
      `UPDATE accounts
              SET balance = balance + $1
              WHERE "accountNumber" = $2 AND "accountType" = $3`,
      [amount, receiverAccountNumber, accountType],
    );

    const deductTransactionChargeQuery = await client.query(
      `UPDATE accounts
              SET balance = balance - $1
              WHERE "accountNumber" = $2 AND "accountType" = $3`,
      [transactionCharge, senderAccountNumber, accountType],
    );

    if (deductBalanceQuery.rowCount === 0 || addBalanceQuery.rowCount === 0 || deductTransactionChargeQuery.rowCount === 0) {
      throw new Error();
    }

    if (senderAccountNumber != null) {
    // Now, we need to add transaction for the SENDER
      const result = await client.query(
        'INSERT INTO transaction ("transactionNumber", "transactionType", "accountNo", "amount", "amountBeforeTransaction") values($1,$2,$3,$4,$5)',
        [senderTransactionNumber, transactionType, senderAccountNumber, -1 * amount, senderBeforeTransactionAmount],
      );
      if (result.rowCount === 0) { throw new Error(); }
    }
    if (receiverAccountNumber != null) {
    // Now, we need to add transaction for the RECEIVER
      const result = await client.query(
        'INSERT INTO transaction ("transactionNumber", "transactionType", "accountNo", "amount", "amountBeforeTransaction") values($1,$2,$3,$4,$5)',
        [receiverTransactionNumber, transactionType, receiverAccountNumber, amount, receiverBeforeTransactionAmount],
      );
      if (result.rowCount === 0) { throw new Error(); }
    }
    await client.query('COMMIT');
    return { status: true, message: 'Money transferred' };
  } catch (e) {
    await client.query('ROLLBACK');
    // throw e;
    return { status: false, message: 'Money could not be transferred' };
  } finally {
    client.release();
  }
};

const withdrawFromAtm = async ({
  accountNumber,
  amount,
  accountType,
  transactionType,
  amountBeforeTransaction,
  senderTransactionNumber,
  currentMonthWithdrawCount,
}) => {
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    if (currentMonthWithdrawCount >= 5) {
      // Now, charge 500 for each withdraw
      const penaltyForLimit = await client.query(
        `UPDATE accounts
                SET balance = balance - $1
                WHERE "accountNumber" = $2 AND "accountType" = $3`,
        [500, accountNumber, accountType],
      );
      if (penaltyForLimit.rowCount === 0) { throw new Error(); }
      amountBeforeTransaction -= 500;
    }

    const deductBalanceQuery = await client.query(
      `UPDATE accounts
              SET balance = balance - $1
              WHERE "accountNumber" = $2 AND "accountType" = $3`,
      [amount, accountNumber, accountType],
    );
    if (deductBalanceQuery.rowCount === 0) { throw new Error(); }

    const result = await client.query(
      'INSERT INTO transaction ("transactionNumber", "transactionType", "accountNo", "amount", "amountBeforeTransaction") values($1,$2,$3,$4,$5)',
      [senderTransactionNumber, transactionType, accountNumber, -1 * amount, amountBeforeTransaction],
    );
    if (result.rowCount === 0) { throw new Error(); }

    await client.query('COMMIT');
    return { status: true, message: 'Money withdrawn from ATM' };
  } catch (e) {
    await client.query('ROLLBACK');
    // throw e;
    return { status: false, message: 'Money could not be withdrawn from ATM' };
  } finally {
    client.release();
  }
};

const withdrawFromBank = async ({
  accountNumber,
  amount,
  accountType,
  transactionType,
  amountBeforeTransaction,
  senderTransactionNumber,
}) => {
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const deductBalanceQuery = await client.query(
      `UPDATE accounts
              SET balance = balance - $1
              WHERE "accountNumber" = $2 AND "accountType" = $3`,
      [amount, accountNumber, accountType],
    );
    if (deductBalanceQuery.rowCount === 0) { throw new Error(); }

    const result = await client.query(
      'INSERT INTO transaction ("transactionNumber", "transactionType", "accountNo", "amount", "amountBeforeTransaction") values($1,$2,$3,$4,$5)',
      [senderTransactionNumber, transactionType, accountNumber, -1 * amount, amountBeforeTransaction],
    );
    if (result.rowCount === 0) { throw new Error(); }

    await client.query('COMMIT');
    return { status: true, message: 'Money withdrawn from Bank' };
  } catch (e) {
    await client.query('ROLLBACK');
    // throw e;
    return { status: false, message: 'Money could not be withdrawn from Bank' };
  } finally {
    client.release();
  }
};

const loanRepayment = async ({
  accountNumber,
  transactionType,
  amount,
  remainingAmountToPay,
  accountType,
  senderTransactionNumber,
}) => {
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const deductBalanceQuery = await client.query(
      `UPDATE accounts
              SET balance = balance - $1
              WHERE "accountNumber" = $2 AND "accountType" = $3`,
      [amount, accountNumber, accountType],
    );
    if (deductBalanceQuery.rowCount === 0) { throw new Error(); }

    const result = await client.query(
      'INSERT INTO transaction ("transactionNumber", "transactionType", "accountNo", "amount", "amountBeforeTransaction") values($1,$2,$3,$4,$5)',
      [senderTransactionNumber, transactionType, accountNumber, -1 * amount, remainingAmountToPay],
    );
    if (result.rowCount === 0) { throw new Error(); }

    if (amount === remainingAmountToPay) {
      const updateStatusResponse = await client.query(
        `UPDATE loan_account
                  set status = $1
                  where "accountNumber" = $2`,
        [LOAN_STATUS.INACTIVE, accountNumber],
      );
      if (updateStatusResponse.rowCount === 0) { throw new Error(); }
    }

    await client.query('COMMIT');
    return { status: true, message: 'Loan amount paid successfully' };
  } catch (e) {
    await client.query('ROLLBACK');
    // throw e;
    return { status: false, message: 'Loan amount couldn\'t be payed' };
  } finally {
    client.release();
  }
};

const depositMoney = async ({
  accountNumber,
  transactionCharge,
  transactionType,
  accountType,
  amount,
  finalAmount,
  receiverTransactionNumber,
  amountBeforeTransaction,
}) => {
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const deductBalanceQuery = await client.query(
      `UPDATE accounts
              SET balance = balance - $1
              WHERE "accountNumber" = $2 AND "accountType" = $3`,
      [transactionCharge, accountNumber, accountType],
    );
    if (deductBalanceQuery.rowCount === 0) { throw new Error(); }

    const addBalanceQuery = await client.query(
      `UPDATE accounts
              SET balance = balance + $1
              WHERE "accountNumber" = $2 AND "accountType" = $3`,
      [finalAmount, accountNumber, accountType],
    );
    if (addBalanceQuery.rowCount === 0) { throw new Error(); }

    const result = await client.query(
      'INSERT INTO transaction ("transactionNumber", "transactionType", "accountNo", "amount", "amountBeforeTransaction") values($1,$2,$3,$4,$5)',
      [receiverTransactionNumber, transactionType, accountNumber, amount, amountBeforeTransaction],
    );
    if (result.rowCount === 0) { throw new Error(); }

    await client.query('COMMIT');
    return { status: true, message: 'Money added' };
  } catch (e) {
    await client.query('ROLLBACK');
    // throw e;
    console.log(e);
    return { status: false, message: 'Money could not be added' };
  } finally {
    client.release();
  }
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
  transferMoney,
  withdrawFromAtm,
  withdrawFromBank,
  loanRepayment,
  depositMoney,
};
