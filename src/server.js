
const express = require('express');
// const authRoute = require('./routes/auth');
// const servicesRoute = require('./routes/services');
// const transactionsRoute = require('./routes/transaction');
// const detailsRoute = require('./routes/details');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- Previous method ---
app.use(express.json());
// app.use(authRoute);
// app.use(servicesRoute);
// app.use(transactionsRoute);
// app.use(detailsRoute);

const { create_account } = require('./controller/createAccountController');
const { signUp, signIn } = require('./controller/userProfileController');
const { get_account_details, get_passbook } = require('./controller/detailsController');
const { loan_repayment, deposit_money, withdraw_from_bank, withdraw_from_atm, transfer_money } = require('./controller/transactionController');


const authMiddleware = require('./middleware/auth');


// ----- API's -----

// user signup and login api's
app.post("/create_user", signUp);
app.post("/log_in", signIn);

// create account api's
app.post("/create_account", authMiddleware, create_account);

// show details api's
app.get("/get_account_details", authMiddleware, get_account_details);
app.get("/get_passbook", authMiddleware, get_passbook);

// transaction api's
app.post("/loan_repayment", authMiddleware, loan_repayment);
app.post("/deposit_money", authMiddleware, deposit_money);
app.post("/withdraw_from_bank", authMiddleware, withdraw_from_bank);
app.post("/withdraw_from_atm", authMiddleware, withdraw_from_atm);
app.post("/transfer_money", authMiddleware, transfer_money);

// Cron jobs
const jobForDeductingMoney = require("./cron/jobForDeductingMoney");
const jobForCalculatingInterestOnSavingAccount = require("./cron/jobForCalculatingInterestOnSavingAccount");
const jobForCalculatingInterestOnLoanAccount = require("./cron/jobForCalculatingInterestOnLoanAccount");

// console.log("in branch one");

app.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});
