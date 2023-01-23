/* eslint-disable no-await-in-loop */
/* eslint-disable max-len */
const {
  insertIntoAccounts, fetchUserAccounts, fetchAccountDetailsFromIdAndType, savingsAccountEntry, loanAccountEntry,
} = require('../models/accountsModel');
const { loanAccountStatus, getLastInterestAddedDates, getLoanAccountDetails } = require('../models/loanAccountModel');
const { fetchAllTransactionOfAccount, addMoneyWithTransaction, subtractMoneyWithTransaction } = require('../models/transactionModel');
const {
  ACCOUNT_TYPES, INTEREST_RATES, TOTAL_DEPOSIT_RATE_FOR_LOAN, MINIMUM_LOAN_AMOUNT, MINIMUM_CURRENT_OPENING_AMOUNT, MINIMUM_SAVINGS_OPENING_AMOUNT, MINIMUM_AGE_FOR_CURRENT, MINIMUM_AGE_FOR_LOAN, LOAN_STATUS, TYPES_OF_ACCOUNT, TRANSACTION_TYPES, CURRENT_ACCOUNT_NRV, CURRENT_ACCOUNT_NRV_PENALTY, SAVINGS_ACCOUNT_NRV, SAVINGS_ACCOUNT_NRV_PENALTY, SAVINGS_ACCOUNT_INTEREST_RATE, MONTHS_IN_YEAR,
} = require('../utils/constants');
const {
  generateAccountNo, calculateAge, formatDate, getLastDayOfMonthYear, generateTransactionNumber,
} = require('../utils/utils');
const { issueAtmCard } = require('./atmServices');
const {
  getUserAccountDetailsOfParticularType, getTotalDepositsOfUser, getMinBalance, subtractMoney, getMinBalanceOfLoanAccount, getTransactionCountForAccount,
} = require('./transactionServices');
const { getUserDetails } = require('./userProfleServices');

const getUserAccount = async (userId, accountType) => {
  const result = await fetchAccountDetailsFromIdAndType(userId, accountType);
  const accountRow = result;
  return accountRow;
};

const validateAgeForAcccount = (age, accountType) => {
  if (accountType === ACCOUNT_TYPES.CURRENT && age < MINIMUM_AGE_FOR_CURRENT) {
    return { status: false, message: 'Minimum age error' };
  } if (accountType === ACCOUNT_TYPES.LOAN && age < MINIMUM_AGE_FOR_LOAN) {
    return { status: false, message: 'Minimum age error' };
  }
  return { status: true };
};

const getLoanInterest = (loanType) => {
  if (INTEREST_RATES.has(loanType)) {
    return { status: true, loanInterest: INTEREST_RATES.get(loanType) };
  }
  return { status: false, loanInterest: 0 };
};

const createSavingsAccount = async (id, amount, accountNumber, formattedDate) => {
  if (amount < MINIMUM_SAVINGS_OPENING_AMOUNT) {
    return { status: false, message: 'Minimum amount error' };
  }

  const { cardNumber, expiryDate, cvv } = await issueAtmCard(accountNumber);
  const accountType = ACCOUNT_TYPES.SAVINGS;
  const savingsAccountResponse = await savingsAccountEntry({
    accountNumber, accountType, id, formattedDate, amount, cardNumber, expiryDate, cvv,
  });
  return savingsAccountResponse;
};

const createCurrentAccount = async (id, amount, accountNumber, formattedDate) => {
  if (amount < MINIMUM_CURRENT_OPENING_AMOUNT) {
    return { status: false, message: 'Minimum amount error' };
  }

  const accountEntryResponse = insertIntoAccounts(accountNumber, ACCOUNT_TYPES.CURRENT, id, formattedDate, amount);
  if (accountEntryResponse.rowCount === 0) {
    return { status: false, message: 'Unable to open account' };
  }
  return { status: true, message: 'Account Created' };
};

const createLoanAccount = async (id, amount, accountNumber, formattedDate, loanType, duration) => {
  // Checking for other accounts
  const accountRows = await fetchUserAccounts(id);

  // Checking all the conditions for creating the loan account
  if (!accountRows[0]) {
    return { status: false, message: 'No other bank account exists' };
  }
  if (amount < MINIMUM_LOAN_AMOUNT) {
    return { status: false, message: 'Minimum amount error' };
  }

  // Can only give 40% of total deposit as loan
  const totalSum = getTotalDepositsOfUser(accountRows);
  if (((totalSum * TOTAL_DEPOSIT_RATE_FOR_LOAN)) < amount) {
    return { status: false, message: 'Loan amount should be lesser than 40% of total deposits' };
  }

  const loanInterestResponse = getLoanInterest(loanType);
  if (!loanInterestResponse.status) {
    return { status: false, message: 'Invalid details entered' };
  }
  const { loanInterest } = loanInterestResponse;

  const accountType = ACCOUNT_TYPES.LOAN;
  const loanStatus = LOAN_STATUS.ACTIVE;
  const loanAccountEntryResponse = await loanAccountEntry({
    accountNumber, accountType, id, formattedDate, amount, loanInterest, loanType, duration, loanStatus,
  });
  return loanAccountEntryResponse;
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

  if (!TYPES_OF_ACCOUNT.includes(accountType)) {
    return { status: false, message: 'Invalid data entered' };
  }

  const validateAgeReponse = validateAgeForAcccount(currentAge, accountType);
  if (!validateAgeReponse.status) { return validateAgeReponse; }

  const currentDate = Date(Date.now()).toString();
  const formattedDate = formatDate(currentDate);

  // Now, creating the user account
  if (accountType === ACCOUNT_TYPES.SAVINGS) {
    // console.log("creating savings account, ", accountNumber, ", ", typeof(accountNumber))
    const createSavingsAccountResponse = await createSavingsAccount(id, amount, accountNumber, formattedDate);
    return createSavingsAccountResponse;
  }
  if (accountType === ACCOUNT_TYPES.CURRENT) {
    const createCurrentAccountResponse = await createCurrentAccount(id, amount, accountNumber, formattedDate);
    return createCurrentAccountResponse;
  }
  if (accountType === ACCOUNT_TYPES.LOAN) {
    const { loanType, duration } = req;
    const createLoanAccountResponse = await createLoanAccount(id, amount, accountNumber, formattedDate, loanType, duration);
    return createLoanAccountResponse;
  }
};

const getAllAccountDetails = async (id) => {
  const savingAccountDetails = await getUserAccountDetailsOfParticularType(id, ACCOUNT_TYPES.SAVINGS);
  const currentAccountDetails = await getUserAccountDetailsOfParticularType(id, ACCOUNT_TYPES.CURRENT);
  const loanAccountDetails = await getLoanAccountDetails(id);

  const responseToSend = {
    Savings: savingAccountDetails,
    Current: currentAccountDetails,
    Loan: loanAccountDetails,
  };
  return responseToSend;
};

const getUserPassbook = async (id, accountType, page, size) => {
  const getAccountDetailsResponse = await fetchAccountDetailsFromIdAndType(id, accountType);
  if (!getAccountDetailsResponse) {
    return { status: false, message: 'Account does not exist' };
  }
  const { accountNumber } = getAccountDetailsResponse;
  const result = await fetchAllTransactionOfAccount(accountNumber, page, size);
  return result.rows;
};

const jobForCalculatingInterestOnSavingAccount = async (currentAccount) => {
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

  const interestToBeAdded = parseInt(((averageAmountOfWholeMonth / 100) * SAVINGS_ACCOUNT_INTEREST_RATE) / MONTHS_IN_YEAR, 10);
  // await addMoney(currentAccount.accountNumber, interestToBeAdded, ACCOUNT_TYPES.SAVINGS);
  // await addTransaction(0, TRANSACTION_TYPES.INTEREST_EARNED, null, currentAccount.accountNumber, interestToBeAdded, formattedDate, null, currentAccount.balance);
  const receiverTransactionNumber = generateTransactionNumber();
  await addMoneyWithTransaction({
    accountNumber: currentAccount.accountNumber,
    amount: interestToBeAdded,
    accountType: ACCOUNT_TYPES.SAVINGS,
    transactionType: TRANSACTION_TYPES.INTEREST_EARNED,
    receiverTransactionNumber,
    amountBeforeTransaction: currentAccount.balance,
  });
  const newBalance = currentAccount.balance + interestToBeAdded;

  // If NRV falls below 100000, then we should charge Rs. 1000 to the user...
  if (totalNRVofWholeMonth < SAVINGS_ACCOUNT_NRV) {
    // await subtractMoney(currentAccount.accountNumber, SAVINGS_ACCOUNT_NRV_PENALTY, ACCOUNT_TYPES.SAVINGS);
    // await addTransaction(0, TRANSACTION_TYPES.PENALTY_FOR_NRV, currentAccount.accountNumber, null, interestToBeAdded, formattedDate, newBalance, null);
    const senderTransactionNumber = generateTransactionNumber();
    await subtractMoneyWithTransaction({
      accountNumber: currentAccount.accountNumber,
      amount: SAVINGS_ACCOUNT_NRV_PENALTY,
      accountType: ACCOUNT_TYPES.SAVINGS,
      transactionType: TRANSACTION_TYPES.PENALTY_FOR_NRV,
      senderTransactionNumber,
      amountBeforeTransaction: newBalance,
    });
    return { status: true, message: 'Penalty imposed' };
  }
  return { status: false, message: 'Penalty not imposed' };
};

const addInterestOnLoanAccount = async (loanAccount) => {
  const creationDateOfLoanAccount = loanAccount.createdAt.getDate();
  const creationMonthOfLoanAccount = loanAccount.createdAt.getMonth() + 1;
  const creationYearOfLoanAccount = loanAccount.createdAt.getFullYear();

  const todayDate = new Date(Date.now());
  const currentMonth = todayDate.getMonth() + 1;
  const currentDay = todayDate.getDate();
  const currentYear = todayDate.getFullYear();

  const lastDateOfMonth = await getLastDayOfMonthYear(currentYear, currentMonth);
  const interestToBeAdded = loanAccount.interest;

  if (((currentDay > creationDateOfLoanAccount && currentMonth === creationMonthOfLoanAccount) || (currentMonth > creationMonthOfLoanAccount)) && currentYear - creationYearOfLoanAccount >= loanAccount.duration) {
    // then loan is defaulted
    const setLoanAccountStatusResponse = await loanAccountStatus(loanAccount.accountNumber, LOAN_STATUS.DEFAULT);
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
  // await addMoney(loanAccount.accountNumber, interestToAdd, ACCOUNT_TYPES.LOAN);
  // await addTransaction(0, TRANSACTION_TYPES.LOAN_INTEREST_ADDED, null, loanAccount.accountNumber, interestToAdd, formattedDate, null, loanAccount.balance);
  const receiverTransactionNumber = generateTransactionNumber();
  await addMoneyWithTransaction({
    accountNumber: loanAccount.accountNumber,
    amount: interestToAdd,
    accountType: ACCOUNT_TYPES.LOAN,
    transactionType: TRANSACTION_TYPES.LOAN_INTEREST_ADDED,
    receiverTransactionNumber,
    amountBeforeTransaction: loanAccount.balance,
  });
  return { status: true, message: 'Interest added' };
};

const calculateNrvAndDeductPenalty = async (currentAccount) => {
  const currentDate = Date(Date.now()).toString();
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
  if (totalNRVofWholeMonth < CURRENT_ACCOUNT_NRV) {
    // await subtractMoney(currentAccount.accountNumber, CURRENT_ACCOUNT_NRV_PENALTY, ACCOUNT_TYPES.CURRENT);
    // await addTransaction(0, TRANSACTION_TYPES.PENALTY_FOR_NRV, currentAccount.accountNumber, null, CURRENT_ACCOUNT_NRV_PENALTY, formattedDate, newBalance, null);
    const senderTransactionNumber = generateTransactionNumber();
    await subtractMoneyWithTransaction({
      accountNumber: currentAccount.accountNumber,
      amount: CURRENT_ACCOUNT_NRV_PENALTY,
      accountType: ACCOUNT_TYPES.CURRENT,
      transactionType: TRANSACTION_TYPES.PENALTY_FOR_NRV,
      senderTransactionNumber,
      amountBeforeTransaction: newBalance,
    });
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
