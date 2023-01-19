/* eslint-disable no-await-in-loop */
/* eslint-disable max-len */
const {
  insertIntoAccounts, fetchUserAccounts, fetchAccountDetailsFromIdAndType, fetchAccountsFromType,
} = require('../models/accountsModel');
const { insertIntoLoanAccounts, loanAccountStatus, getLastInterestAddedDates } = require('../models/loanAccountModel');
const { fetchAllTransactionOfAccount } = require('../models/transactionModel');
const {
  generateAccountNo, calculateAge, formatDate, getLastDayOfMonthYear,
} = require('../utils/utils');
const { issueAtmCard } = require('./atmServices');
const {
  getUserAccountDetailsOfParticularType, getUserAccountDetailsOfLoanAccount, getTotalDepositsOfUser, getMinBalance, addMoney, addTransaction, subtractMoney, getMinBalanceOfLoanAccount, getTransactionCountForAccount,
} = require('./transactionServices');
const { getUserDetails } = require('./userProfleServices');

const getUserAccount = async (userId, accountType) => {
  const result = await fetchAccountDetailsFromIdAndType(userId, accountType);
  const accountRow = result.rows[0];
  return accountRow;
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

  const accountEntryResponse = await insertIntoAccounts(accountNumber, 'SAVINGS', id, formattedDate, amount);
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

  const accountEntryResponse = insertIntoAccounts(accountNumber, 'CURRENT', id, formattedDate, amount);
  if (accountEntryResponse.rowCount === 0) {
    return { status: false, message: 'Unable to open account' };
  }
  return { status: true, message: 'Account Created' };
};

const createLoanAccount = async (id, amount, accountNumber, formattedDate, loanType, duration) => {
  // Checking for other accounts
  const userRows = await fetchUserAccounts(id);

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

  const accountEntryResponse = await insertIntoAccounts(accountNumber, 'LOAN', id, formattedDate, amount);
  const loanAccountEntryResponse = await insertIntoLoanAccounts(accountNumber, loanType, loanInterest, amount, duration, 'active');

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
  const getAccountDetailsResponse = await fetchAccountDetailsFromIdAndType(id, accountType);
  if (!getAccountDetailsResponse.rows) {
    return { status: false, message: 'Account does not exist' };
  }
  const { accountNumber } = getAccountDetailsResponse.rows[0];
  const result = await fetchAllTransactionOfAccount(accountNumber, page, size);
  return result.rows;
};

const jobForCalculatingInterestOnSavingAccount = async (currentAccount) => {
  const currentDate = Date(Date.now()).toString();
  const formattedDate = formatDate(currentDate);

  const d = new Date(Date.now());
  const prevDate = new Date(d);
  prevDate.setDate(prevDate.getDate() - 1);
  const month = prevDate.getMonth() + 1;
  const day = prevDate.getDate();
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
    return { status: true, message: 'Penalty imposed' };
  }
  return { status: false, message: 'Penalty not imposed' };
};

const addInterestOnLoanAccount = async (loanAccount) => {
  const creationDateOfLoanAccount = loanAccount.createdAt.getDate();
  const creationMonthOfLoanAccount = loanAccount.createdAt.getMonth() + 1;
  const creationYearOfLoanAccount = loanAccount.createdAt.getFullYear();

  const currentDate = Date(Date.now()).toString();
  const formattedDate = formatDate(currentDate);
  const todayDate = new Date(Date.now());
  const currentMonth = todayDate.getMonth() + 1;
  const currentDay = todayDate.getDate();
  const currentYear = todayDate.getFullYear();

  const lastDateOfMonth = await getLastDayOfMonthYear(currentYear, currentMonth);
  const interestToBeAdded = loanAccount.interest;

  if (((currentDay > creationDateOfLoanAccount && currentMonth === creationMonthOfLoanAccount) || (currentMonth > creationMonthOfLoanAccount)) && currentYear - creationYearOfLoanAccount >= loanAccount.duration) {
    // then loan is defaulted
    const setLoanAccountStatusResponse = await loanAccountStatus(loanAccount.accountNumber, 'default');
    return { status: false, message: 'Loan is defaulted' };
  }

  if (creationDateOfLoanAccount === currentDay && creationMonthOfLoanAccount === currentMonth && creationYearOfLoanAccount === currentYear) {
    // Loan is created on this date, so can't add interest here
    return { status: false, message: 'Loan is created on this date only' };
  }
  if ((creationMonthOfLoanAccount - currentMonth + 12) % 6 !== 0) {
    // Month is not right to add interest
    return { status: false, message: 'Wrong month to calculate the interest' };
  }

  if (creationDateOfLoanAccount < currentDay) {
    // interest for this account is already calculated some days before
    return { status: false, message: 'Interest already calculated' };
  }

  if (currentDay !== lastDateOfMonth && creationDateOfLoanAccount > currentDay) {
    // since, it is not last date of month, and we have creationDateOfLoanAccount further of us, so we'll need to calculate interest on some upcoming days
    return { status: false, message: 'Not last day of the month' };
  }

  const lastInterestAddedDateQuery = await getLastInterestAddedDates(loanAccount.accountNumber);
  let lastInterestAddedDate = new Date(Date.now());
  if (lastInterestAddedDateQuery.rows.length === 0) {
    lastInterestAddedDate = loanAccount.createdAt;
  } else {
    lastInterestAddedDate = lastInterestAddedDateQuery.rows[0].date_of_transaction;
  }
  let numberOfDays = 0;
  const dateCounter = new Date(lastInterestAddedDate);
  while (dateCounter <= todayDate) {
    numberOfDays += 1;
    dateCounter.setDate(dateCounter.getDate() + 1);
  }

  const minBalance = await getMinBalanceOfLoanAccount(lastInterestAddedDate, todayDate, numberOfDays, loanAccount.accountNumber, loanAccount.balance);
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
  await addMoney(loanAccount.accountNumber, interestToAdd, 'LOAN');
  await addTransaction(0, 'LOAN_INTEREST_ADDED', null, loanAccount.accountNumber, interestToAdd, formattedDate, null, loanAccount.balance);
  return { status: true, message: 'Interest added' };
};

const calculateNrvAndDeductPenalty = async (currentAccount) => {
  const currentDate = Date(Date.now()).toString();
  const formattedDate = formatDate(currentDate);
  const d = new Date(Date.now());
  const prevDate = new Date(d);
  prevDate.setDate(prevDate.getDate() - 1);
  const month = `${prevDate.getMonth() + 1}`;
  const day = `${prevDate.getDate()}`;
  const year = prevDate.getFullYear();

  const transactionCountResponse = await getTransactionCountForAccount(currentAccount.accountNumber, currentDate);
  const transactionCountForUser = transactionCountResponse.rows[0].count;

  let message1 = 'Penalty not imposed, since has more than or equal to 3 transactions';

  let newBalance = currentAccount.balance;
  if (transactionCountForUser < 3) {
    // Now, deduct amount of 500 from this account
    const subtractMoneyResponse = await subtractMoney(currentAccount.accountNumber, 500, currentAccount.account_type);
    if (subtractMoneyResponse.rowCount !== 0) {
      newBalance -= 500;
    }
    message1 = 'Penalty imposed, since has less than 3 transactions';
  }

  const minBalance = await getMinBalance(month, year, currentAccount.accountNumber, currentAccount.balance, day);

  const numberOfDays = minBalance.length - 1;
  let totalNRVofWholeMonth = 0;
  for (let dayIterator = 1; dayIterator <= numberOfDays; dayIterator += 1) {
    if (minBalance[dayIterator] !== undefined && minBalance[dayIterator] !== null) {
      totalNRVofWholeMonth += minBalance[dayIterator];
    }
  }

  // If NRV falls below 100000, then we should charge Rs. 1000 to the user...
  if (totalNRVofWholeMonth < 500000) {
    await subtractMoney(currentAccount.accountNumber, 5000, 'CURRENT');
    await addTransaction(0, 'PENALTY_FOR_NRV', currentAccount.accountNumber, null, 5000, formattedDate, newBalance, null);
    return { message1, message2: 'Penalty imposed, because of NRV' };
  }
  return { message1, message2: 'Penalty not imposed, since NRV is maintained' };
};

module.exports = {
  getUserPassbook,
  getAllAccountDetails,
  createBankAccount,
  getUserAccount,
  createSavingsAccount,
  createCurrentAccount,
  createLoanAccount,
  validateAgeForAcccount,
  getLoanInterest,
  jobForCalculatingInterestOnSavingAccount,
  addInterestOnLoanAccount,
  calculateNrvAndDeductPenalty,
};
