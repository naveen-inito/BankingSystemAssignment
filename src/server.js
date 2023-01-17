/* eslint-disable no-unused-vars */
/* eslint-disable quotes */
const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

const { createAccount } = require('./controller/accountController');
const { signUp, signIn } = require('./controller/userProfileController');
const { getAccountDetails, getPassbook } = require('./controller/detailsController');
const {
  loanRepayment, depositMoney, withdrawFromBank, withdrawFromAtm, transferMoney,
} = require('./controller/transactionController');

const authMiddleware = require('./middleware/auth');

// ----- API's -----

// user signup and login api's
app.post("/api/user", signUp);
app.post("/api/login", signIn);

// create account api's
app.post("/api/account", authMiddleware, createAccount);

// show details api's
app.get("/api/account-details", authMiddleware, getAccountDetails);
app.get("/api/passbook", authMiddleware, getPassbook);

// transaction api's
app.post("/api/loan-repayment", authMiddleware, loanRepayment);
app.post("/api/deposit-money", authMiddleware, depositMoney);
app.post("/api/withdraw-from-bank", authMiddleware, withdrawFromBank);
app.post("/api/withdraw-from-atm", authMiddleware, withdrawFromAtm);
app.post("/api/transfer-money", authMiddleware, transferMoney);

// Cron jobs
const jobForDeductingMoney = require("./cron/jobForDeductingMoney");
const jobForCalculatingInterestOnSavingAccount = require("./cron/jobForCalculatingInterestOnSavingAccount");
const jobForCalculatingInterestOnLoanAccount = require("./cron/jobForCalculatingInterestOnLoanAccount");

app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});
