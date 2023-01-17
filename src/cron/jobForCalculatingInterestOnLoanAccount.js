/* eslint-disable no-await-in-loop */
/* eslint-disable no-continue */
/* eslint-disable max-len */
const schedule = require('node-schedule');
const { pool } = require('../db/connection');

const { getMinBalanceOfLoanAccount, addMoney, addTransaction } = require('../services/transactionServices');
const {
  formatDate, getLastDayOfMonthYear,
} = require('../utils/utils');

// Job for calculating interest on "LOAN" account...
// This job should run "ONCE PER DAY"
// Interest for an account is calculated every 6 months
// const jobString = '*/5 * * * * *';
const jobString = '55 23 * * *';
const schduleJobForCalculatingInterestOnLoanAccount = schedule.scheduleJob(jobString, async () => {
  try {
    const currentDate = Date(Date.now()).toString();
    const formattedDate = formatDate(currentDate);

    const result = await pool.query(
      `select *
            FROM accounts AS T1, loan_account AS T2
            WHERE T1."accountNumber" = T2."accountNumber"
            AND T1."accountType" = 'LOAN'
            AND T2.status = 'active'`,
    );
    const allLoanAccounts = result.rows;
    const numberOfRows = result.rows.length;

    const todayDate = new Date(Date.now());
    const currentMonth = `${todayDate.getMonth() + 1}`;
    const currentDay = `${todayDate.getDate()}`;
    const currentYear = todayDate.getFullYear();

    const lastDateOfMonth = await getLastDayOfMonthYear(currentYear, currentMonth);

    for (let accountIterator = 0; accountIterator < numberOfRows; accountIterator += 1) {
      const currentAccount = allLoanAccounts[accountIterator];
      const creationDateOfLoanAccount = currentAccount.createdAt.getDate();
      const creationMonthOfLoanAccount = currentAccount.createdAt.getMonth() + 1;
      const creationYearOfLoanAccount = currentAccount.createdAt.getFullYear();

      const interestToBeAdded = currentAccount.interest;

      if (((currentDay > creationDateOfLoanAccount && currentMonth === creationMonthOfLoanAccount) || (currentMonth > creationMonthOfLoanAccount)) && currentYear - creationYearOfLoanAccount >= currentAccount.duration) {
        // then loan is defaulted
        await pool.query(
          `UPDATE loan_account
            set status = 'default'
            where "accountNumber" = $1`,
          [currentAccount.accountNumber],
        );
        continue;
      }

      if (creationDateOfLoanAccount === currentDay && creationMonthOfLoanAccount === currentMonth && creationYearOfLoanAccount === currentYear) {
        // Loan is created on this date, so can't add interest here
        continue;
      }
      if ((creationMonthOfLoanAccount - currentMonth + 12) % 6 !== 0) {
        // Month is not right to add interest
        continue;
      }

      if (creationDateOfLoanAccount < currentDay) {
        // interest for this account is already calculated some days before
        continue;
      }

      if (currentDay !== lastDateOfMonth && creationDateOfLoanAccount > currentDay) {
        // since, it is not last date of month, and we have creationDateOfLoanAccount further of us, so we'll need to calculate interest on some upcoming days
        continue;
      }

      const lastInterestAddedDateQuery = await pool.query(
        `select *
        FROM transaction
        WHERE "accountNo" = $1
        AND "transactionType" = 'LOAN_INTEREST_ADDED'
        ORDER BY "dateOfTransaction" DESC`,
        [currentAccount.accountNumber],
      );
      let lastInterestAddedDate = new Date(Date.now());
      if (lastInterestAddedDateQuery.rows.length === 0) {
        lastInterestAddedDate = currentAccount.createdAt;
      } else {
        lastInterestAddedDate = lastInterestAddedDateQuery.rows[0].date_of_transaction;
      }
      let numberOfDays = 0;
      const dateCounter = new Date(lastInterestAddedDate);
      while (dateCounter <= todayDate) {
        numberOfDays += 1;
        dateCounter.setDate(dateCounter.getDate() + 1);
      }

      const minBalance = await getMinBalanceOfLoanAccount(lastInterestAddedDate, todayDate, numberOfDays, currentAccount.accountNumber, currentAccount.balance);

      numberOfDays = minBalance.length;
      let total = 0;
      let count = 0;
      for (let dayIterator = 1; dayIterator < numberOfDays; dayIterator += 1) {
        if (minBalance[dayIterator] !== undefined && minBalance[dayIterator] !== null) {
          total += minBalance[dayIterator];
          count += 1;
        }
      }
      const average = total / count;
      const interestToAdd = parseInt(((average / 100) * interestToBeAdded) / 2, 10);
      await addMoney(currentAccount.accountNumber, interestToAdd, 'LOAN');

      await addTransaction(0, 'LOAN_INTEREST_ADDED', null, currentAccount.accountNumber, interestToAdd, formattedDate, null, currentAccount.balance);
    }
  } catch (error) {
    console.log(error);
  }
});
