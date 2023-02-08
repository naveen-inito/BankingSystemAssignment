/* eslint-disable import/extensions */
/* eslint-disable no-unused-vars */
/* eslint-disable quotes */
require('dotenv').config();

const PORT = process.env.PORT || 5000;
const app = require('./app.js');

// Cron jobs
const jobForDeductingMoney = require("./cron/jobForDeductingMoney");
const jobForCalculatingInterestOnSavingAccount = require("./cron/jobForCalculatingInterestOnSavingAccount");
const jobForCalculatingInterestOnLoanAccount = require("./cron/jobForCalculatingInterestOnLoanAccount");

app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});
