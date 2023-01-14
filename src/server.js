
const express = require('express');
const authRoute = require('./routes/auth');
const servicesRoute = require('./routes/services');
const transactionsRoute = require('./routes/transaction');
const detailsRoute = require('./routes/details');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(authRoute);
app.use(servicesRoute);
app.use(transactionsRoute);
app.use(detailsRoute);

const jobForDeductingMoney = require("./cron/jobForDeductingMoney");
const jobForCalculatingInterestOnSavingAccount = require("./cron/jobForCalculatingInterestOnSavingAccount");
const jobForCalculatingInterestOnLoanAccount = require("./cron/jobForCalculatingInterestOnLoanAccount");

console.log("in branch one");

app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});
