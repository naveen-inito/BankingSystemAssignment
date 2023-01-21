const schedule = require('node-schedule');
const { fetchActiveLoanAccounts } = require('../models/loanAccountModel');
const { addInterestOnLoanAccount } = require('../services/accountServices');

// Job for calculating interest on "LOAN" account... This job should run "ONCE PER DAY"
// Interest for an account is calculated every 6 months
// const jobString = '*/5 * * * * *';
const jobString = '55 23 * * *';
const schduleJobForCalculatingInterestOnLoanAccount = schedule.scheduleJob(jobString, async () => {
  try {
    const result = await fetchActiveLoanAccounts();
    const allLoanAccounts = result.rows;
    const numberOfRows = result.rows.length;
    for (let accountIterator = 0; accountIterator < numberOfRows; accountIterator += 1) {
      const response = await addInterestOnLoanAccount(allLoanAccounts[accountIterator]);
    }
  } catch (error) {
    console.log(error);
  }
});
