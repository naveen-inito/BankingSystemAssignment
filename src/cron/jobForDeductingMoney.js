/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
/* eslint-disable no-await-in-loop */
const schedule = require('node-schedule');
const { pool } = require('../db/connection');
const { fetchAccountsFromType } = require('../models/accountsModel');
const { calculateNrvAndDeductPenalty } = require('../services/accountServices');
const { CURRENT } = require('../utils/constants');

const { formatDate } = require('../utils/utils');

// This job should run "ONCE A MONTH"
// This should only happen for "CURRENT" account
// const jobString = '*/5 * * * * *';
const jobString = '55 23 * * *';
const schduleJobForDeductingMoneyForLessTransactions = schedule.scheduleJob(jobString, async () => {
  try {
    const result = await fetchAccountsFromType(CURRENT);
    const allAccounts = result.rows;
    const numberOfRows = result.rows.length;
    for (let accountIterator = 0; accountIterator < numberOfRows; accountIterator += 1) {
      const currentAccount = allAccounts[accountIterator];
      const respose = await calculateNrvAndDeductPenalty(currentAccount);
    }
  } catch (error) {
    console.log(error);
  }
});
