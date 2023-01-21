/* eslint-disable no-unused-vars */
/* eslint-disable no-await-in-loop */
/* eslint-disable max-len */
const schedule = require('node-schedule');
const { fetchAccountsFromType } = require('../models/accountsModel');
const { jobForCalculatingInterestOnSavingAccount } = require('../services/accountServices');
const { SAVINGS } = require('../utils/constants');

// Job for calculating interest on "SAVINGS" account...
// This job should run "ONCE A MONTH"
// const jobString = "*/10 * * * * *";
const jobString = '0 0 1 * *';
const schduleJobForCalculatingInterestOnSavingAccount = schedule.scheduleJob(jobString, async () => {
  try {
    // Getting all the savings account
    const result = await fetchAccountsFromType(SAVINGS);
    const allUsers = result.rows;
    const numberOfRows = result.rows.length;
    for (let userIterator = 0; userIterator < numberOfRows; userIterator += 1) {
      const currentAccount = allUsers[userIterator];
      const respone = await jobForCalculatingInterestOnSavingAccount(currentAccount);
    }
  } catch (error) {
    console.log(error);
  }
});
