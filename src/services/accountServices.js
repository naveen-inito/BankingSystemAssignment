/* eslint-disable max-len */
const { insertIntoAccounts, fetchUserAccounts, fetchAccountDetailsFromIdAndType } = require('../models/accountsModel');
const { insertIntoLoanAccounts } = require('../models/loanAccountModel');
const {
  generateAccountNo, calculateAge, formatDate,
} = require('../utils/utils');
const { issueAtmCard } = require('./atmServices');
const {
  getUserAccountDetailsOfParticularType, getUserAccountDetailsOfLoanAccount, getTotalDepositsOfUser, getAllTransactionsOfAccount,
} = require('./transactionServices');
const { getUserDetails } = require('./userProfleServices');

const getUserAccount = async (userId, accountType) => {
  const result = await fetchAccountDetailsFromIdAndType(userId, accountType);
  const accountRow = result.rows[0];
  return accountRow;
};

const accountEntry = async (accountNumber, accountType, userId, formattedDate, amount) => {
  const result = await insertIntoAccounts(accountNumber, accountType, userId, formattedDate, amount);
  return result;
};

const loanAccountEntry = async (accountNumber, loanType, loanInterest, amount, duration, status) => {
  const result = await insertIntoLoanAccounts(accountNumber, loanType, loanInterest, amount, duration, status);
  return result;
};

const getAllUserAccounts = async (userId) => {
  const result = await fetchUserAccounts(userId);
  return result;
};

const getAccountNumber = async (userId, accountType) => {
  const getAccountNumberQuery = await fetchAccountDetailsFromIdAndType(userId, accountType);
  return getAccountNumberQuery.rows[0];
};

const validateAgeForAcccount = (age, accountType) => {
  if (accountType === 'CURRENT' && age < 18) {
    return { status: false, message: 'Minimum age error' };
  } if (accountType === 'LOAN' && age < 25) {
    return { status: false, message: 'Minimum age error' };
  }
  return { status: true, message: 'Age is fine to create account' };
};

const getLoanInterest = (loanType) => {
  let loanInterest = 0;
  let status = true;
  if (loanType === 'HOME') {
    loanInterest = 7;
  } else if (loanType === 'CAR') {
    loanInterest = 8;
  } else if (loanType === 'PERSONAL') {
    loanInterest = 12;
  } else if (loanType === 'BUSINESS') {
    loanInterest = 15;
  } else {
    status = false;
  }
  return { status, loanInterest };
};

const createSavingsAccount = async (id, amount, accountNumber, formattedDate) => {
  if (amount < 10000) {
    return { status: false, message: 'Minimum amount error' };
  }

  const accountEntryResponse = await accountEntry(accountNumber, 'SAVINGS', id, formattedDate, amount);
  if (accountEntryResponse.rowCount === 0) {
    return { status: false, message: 'Unable to open account' };
  }

  const atmResult = await issueAtmCard(accountNumber);
  if (atmResult.rowCount === 0) {
    return { status: false, message: 'Unable to open account' };
  }
  return { status: true, message: 'Account Created' };
};

const createCurrentAccount = async (id, amount, accountNumber, formattedDate) => {
  if (amount < 100000) {
    return { status: false, message: 'Minimum amount error' };
  }

  const accountEntryResponse = accountEntry(accountNumber, 'CURRENT', id, formattedDate, amount);
  if (accountEntryResponse.rowCount === 0) {
    return { status: false, message: 'Unable to open account' };
  }
  return { status: true, message: 'Account Created' };
};

const createLoanAccount = async (id, amount, accountNumber, formattedDate, loanType, duration) => {
  // Checking for other accounts
  const userRows = await getAllUserAccounts(id);

  // Checking all the conditions for creating the loan account
  if (!userRows[0]) {
    return { status: false, message: 'No other bank account exists' };
  }
  if (amount < 500000) {
    return { status: false, message: 'Minimum amount error' };
  }

  // Can only give 40% of total deposit as loan
  const totalSum = getTotalDepositsOfUser(userRows);
  if (((totalSum * 40) / 100) < amount) {
    return { status: false, message: 'Loan amount should be lesser than 40% of total deposits' };
  }

  const loanInterestResponse = getLoanInterest(loanType);
  if (!loanInterestResponse.status) {
    return { status: false, message: 'Invalid details entered' };
  }
  const { loanInterest } = loanInterestResponse;

  const accountEntryResponse = await accountEntry(accountNumber, 'LOAN', id, formattedDate, amount);
  const loanAccountEntryResponse = await loanAccountEntry(accountNumber, loanType, loanInterest, amount, duration, 'active');

  if (accountEntryResponse.rowCount === 0 || (await loanAccountEntryResponse).rowCount === 0) {
    return { status: false, message: 'Loan cannot be provided' };
  }
  return { status: true, message: 'Account Created' };
};

const createBankAccount = async (req) => {
  const { id, accountType, amount } = req;
  const userDetails = await getUserDetails(id);
  const { dob } = userDetails;

  // Checking if the same accountType already exists for the current user
  const accountResponse = await getUserAccount(id, accountType);
  if (accountResponse) {
    return { status: false, message: 'Account already exists' };
  }

  const accountNumber = BigInt(generateAccountNo(15));
  const currentAge = calculateAge(dob);

  if (accountType !== 'SAVINGS' && accountType !== 'CURRENT' && accountType !== 'LOAN') {
    return { status: false, message: 'Invalid data entered' };
  }

  const validateAgeReponse = validateAgeForAcccount(currentAge, accountType);
  if (!validateAgeReponse.status) { return validateAgeReponse; }

  const currentDate = Date(Date.now()).toString();
  const formattedDate = formatDate(currentDate);

  // Now, creating the user account
  if (accountType === 'SAVINGS') {
    // console.log("creating savings account, ", accountNumber, ", ", typeof(accountNumber))
    const createSavingsAccountResponse = await createSavingsAccount(id, amount, accountNumber, formattedDate);
    return createSavingsAccountResponse;
  }
  if (accountType === 'CURRENT') {
    const createCurrentAccountResponse = await createCurrentAccount(id, amount, accountNumber, formattedDate);
    return createCurrentAccountResponse;
  }
  if (accountType === 'LOAN') {
    const { loanType, duration } = req;
    const createLoanAccountResponse = await createLoanAccount(id, amount, accountNumber, formattedDate, loanType, duration);
    return createLoanAccountResponse;
  }
  return { status: true, message: 'Account Created' };
};

const getAllAccountDetails = async (id) => {
  const savingAccountDetails = await getUserAccountDetailsOfParticularType(id, 'SAVINGS');
  const currentAccountDetails = await getUserAccountDetailsOfParticularType(id, 'CURRENT');
  const loanAccountDetails = await getUserAccountDetailsOfLoanAccount(id);

  const savingAccount = savingAccountDetails.rows[0];
  const currentAccount = currentAccountDetails.rows[0];
  const loanAccount = loanAccountDetails.rows[0];

  const responseToSend = {
    Savings: savingAccount,
    Current: currentAccount,
    Loan: loanAccount,
  };
  return responseToSend;
};

const getUserPassbook = async (id, accountType, page, size) => {
  const getAccountNumberResponse = await getAccountNumber(id, accountType);
  if (!getAccountNumberResponse) {
    return { status: false, message: 'Account does not exist' };
  }
  const { accountNumber } = getAccountNumberResponse;
  const result = await getAllTransactionsOfAccount(accountNumber, page, size);
  return result.rows;
};

module.exports = {
  getUserPassbook,
  getAllAccountDetails,
  createBankAccount,
  getUserAccount,
  getAllUserAccounts,
  accountEntry,
  loanAccountEntry,
  getAccountNumber,
};
