/* eslint-disable no-await-in-loop */
/* eslint-disable max-len */
const schedule = require('node-schedule');
const { pool } = require('../db/connection');
const { getMinBalance, addMoney, addTransaction, subtractMoney } = require('../services/transactionServices');
const { formatDate } = require('../utils/utils');

// Job for calculating interest on "SAVINGS" account...
// This job should run "ONCE A MONTH"
// const jobString = "*/10 * * * * *";
const jobString = '0 0 1 * *';
const schduleJobForCalculatingInterestOnSavingAccount = schedule.scheduleJob(jobString, async () => {
  try {
    const currentDate = Date(Date.now()).toString();
    const formattedDate = formatDate(currentDate);

    // Getting all the savings account
    const result = await pool.query(
      'select * from accounts where "accountType" = \'SAVINGS\'',
    );

    const allUsers = result.rows;
    const numberOfRows = result.rows.length;
    for (let userIterator = 0; userIterator < numberOfRows; userIterator += 1) {
      const currentAccount = allUsers[userIterator];

      const d = new Date(Date.now());
      const prevDate = new Date(d);
      prevDate.setDate(prevDate.getDate() - 1);
      const month = `${prevDate.getMonth() + 1}`;
      const day = `${prevDate.getDate()}`;
      const year = prevDate.getFullYear();

      const minBalance = await getMinBalance(month, year, currentAccount.accountNumber, currentAccount.balance, day);

      const numberOfDays = minBalance.length - 1;

      let totalNRVofWholeMonth = 0;
      for (let dayIterator = 1; dayIterator <= numberOfDays; dayIterator += 1) {
        totalNRVofWholeMonth += minBalance[dayIterator];
      }
      const averageAmountOfWholeMonth = totalNRVofWholeMonth / numberOfDays;

      const interestToBeAdded = parseInt(((averageAmountOfWholeMonth / 100) * 6) / 12, 10);
      await addMoney(currentAccount.accountNumber, interestToBeAdded, 'SAVINGS');
      await addTransaction(0, 'INTEREST_EARNED', null, currentAccount.accountNumber, interestToBeAdded, formattedDate, null, currentAccount.balance);
      const newBalance = currentAccount.balance + interestToBeAdded;

      // If NRV falls below 100000, then we should charge Rs. 1000 to the user...
      if (totalNRVofWholeMonth < 100000) {
        await subtractMoney(currentAccount.accountNumber, 1000, 'SAVINGS');
        await addTransaction(0, 'PENALTY_FOR_NRV', currentAccount.accountNumber, null, interestToBeAdded, formattedDate, newBalance, null);
      }
    }
  } catch (error) {
    console.log(error);
  }
});
