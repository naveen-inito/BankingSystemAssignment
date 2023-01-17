/* eslint-disable max-len */
/* eslint-disable no-await-in-loop */
const schedule = require('node-schedule');
const { pool } = require('../db/connection');
const {
  getTransactionCountForAccount, subtractMoney, getMinBalance, addTransaction,
} = require('../services/transactionServices');

const { formatDate } = require('../utils/utils');

// This job should run "ONCE A MONTH"
// This should only happen for "CURRENT" account
// const jobString = '*/5 * * * * *';
const jobString = '55 23 * * *';
const schduleJobForDeductingMoneyForLessTransactions = schedule.scheduleJob(jobString, async () => {
  try {
    const result = await pool.query(
      'select * from accounts where "accountType" = \'CURRENT\'',
    );

    const allAccounts = result.rows;
    const numberOfRows = result.rows.length;
    const currentDate = Date(Date.now()).toString();
    const formattedDate = formatDate(currentDate);

    const d = new Date(Date.now());
    const prevDate = new Date(d);
    prevDate.setDate(prevDate.getDate() - 1);
    const month = `${prevDate.getMonth() + 1}`;
    const day = `${prevDate.getDate()}`;
    const year = prevDate.getFullYear();

    for (let accountIterator = 0; accountIterator < numberOfRows; accountIterator += 1) {
      const currentAccount = allAccounts[accountIterator];

      const transactionCountResponse = await getTransactionCountForAccount(currentAccount.accountNumber, currentDate);
      const transactionCountForUser = transactionCountResponse.rows[0].count;

      let newBalance = currentAccount.balance;
      if (transactionCountForUser < 3) {
        // Now, deduct amount of 500 from this account
        const subtractMoneyResponse = await subtractMoney(currentAccount.accountNumber, 500, currentAccount.account_type);
        if (subtractMoneyResponse.rowCount !== 0) {
          newBalance -= 500;
        }
      }

      const minBalance = await getMinBalance(month, year, currentAccount.accountNumber, currentAccount.balance, day);

      const numberOfDays = minBalance.length - 1;
      let totalNRVofWholeMonth = 0;
      for (let dayIterator = 1; dayIterator <= numberOfDays; dayIterator += 1) {
        if (minBalance[dayIterator] !== undefined && minBalance[dayIterator] !== null) {
          totalNRVofWholeMonth += minBalance[dayIterator];
        }
      }

      // If NRV falls below 100000, then we should charge Rs. 1000 to the user...
      if (totalNRVofWholeMonth < 500000) {
        await subtractMoney(currentAccount.accountNumber, 5000, 'CURRENT');
        await addTransaction(0, 'PENALTY_FOR_NRV', currentAccount.accountNumber, null, 5000, formattedDate, newBalance, null);
      }
    }
  } catch (error) {
    console.log(error);
  }
});
