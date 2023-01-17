/* eslint-disable no-await-in-loop */
/* eslint-disable max-len */
const { fetchAccountDetails, deductFromBalance, addToBalance } = require('../models/accountsModel');
const { loanAccountStatus, getLoanAccountDetails, deductAmountFromLoanAccount } = require('../models/loanAccountModel');
const {
  getSumOfAmountFromAccountNoAndTransactionType, fetchParticularMonthTransactionCountOfAccount, fetchParticularDayWithdrawAmount, fetchParticularMonthAtmWithdrawCount, insertIntoTransaction, fetchParticularMonthTransactions, fetchLoanTransactions, fetchAllTransactionOfAccount,
} = require('../models/transactionModel');
const {
  formatDate, getNumberOfDays, generateTransactionNumber, getUserId,
} = require('../utils/utils');
const { verifyCardDetails } = require('./atmServices');

const getAllTransactionsOfAccount = async (accountNumber) => {
  const result = await fetchAllTransactionOfAccount(accountNumber);
  return result;
};

const getLoanAmountRepayed = async (accountNumber) => {
  const result = await getSumOfAmountFromAccountNoAndTransactionType(accountNumber, 'LOAN_REPAYMENT');
  return result;
};

const updateLoanStatus = async (accountNumber, status) => {
  const result = await loanAccountStatus(accountNumber, status);
  return result;
};

const getUserAccountDetailsOfLoanAccount = async (userId) => {
  const result = await getLoanAccountDetails(userId);
  return result;
};

const getTransactionCountForAccount = async (accountNumber, formattedDate) => {
  const d = new Date(formattedDate);
  const month = `${d.getMonth() + 1}`;
  const year = d.getFullYear();
  const result = await fetchParticularMonthTransactionCountOfAccount(accountNumber, month, year);
  return result;
};

const getUserAccountDetailsOfParticularType = async (userId, accountType) => {
  const result = await fetchAccountDetails(userId, accountType);
  return result;
};

const getTotalDepositsOfUser = async (userRows) => {
  const len = userRows.length;
  let totalSum = 0;
  for (let rowIterator = 0; rowIterator < len; rowIterator += 1) {
    totalSum += userRows.balance;
  }
  return totalSum;
};

const subtractMoney = async (accountNumber, amount, accountType) => {
  const result = await deductFromBalance(amount, accountNumber, accountType);
  return result;
};
const subtractMoneyFromLoanAccount = async (accountNumber, amount) => {
  const result = await deductAmountFromLoanAccount(accountNumber, amount);
  return result;
};

const addMoney = async (accountNumber, amount, accountType) => {
  const result = await addToBalance(accountNumber, amount, accountType);
  return result;
};

const getCurrentDayWithdrawalAmount = async (accountNumber, formattedDate) => {
  const d = new Date(Date.now());
  const month = `${d.getMonth() + 1}`;
  const day = `${d.getDate()}`;
  const year = d.getFullYear();
  const result = await fetchParticularDayWithdrawAmount(accountNumber, day, month, year);
  return result;
};

const getCurrentMonthAtmWithdrawCount = async (accountNumber, formattedDate) => {
  const d = new Date(Date.now());
  const month = `${d.getMonth() + 1}`;
  const year = d.getFullYear();
  const result = await fetchParticularMonthAtmWithdrawCount(accountNumber, month, year);
  return result;
};

const addTransaction = async (transactionNumber, transactionType, senderAccountNumber, receiverAccountNumber, amount, formattedDate, senderAmountBeforeTransaction, receiverAmountBeforeTransaction) => {
  const senderTransactionNumber = generateTransactionNumber();
  const receiverTransactionNumber = generateTransactionNumber();

  if (senderAccountNumber != null) {
    // Now, we need to add transaction for the SENDER
    const result = await insertIntoTransaction(senderTransactionNumber, transactionType, senderAccountNumber, -1 * amount, senderAmountBeforeTransaction);
    if (receiverAccountNumber == null) { return result; }
  }
  if (receiverAccountNumber != null) {
    // Now, we need to add transaction for the RECEIVER
    const result = await insertIntoTransaction(receiverTransactionNumber, transactionType, receiverAccountNumber, amount, receiverAmountBeforeTransaction);
    return result;
  }
};

const getMinBalance = async (month, year, accountNumber, balance, numberOfDays) => {
  const result = await fetchParticularMonthTransactions(accountNumber, month, year);

  const allTransactions = result.rows;
  const transactionCount = allTransactions.length;

  const startDay = new Array(numberOfDays + 1);
  const finalAmountOfDay = new Array(numberOfDays + 1);

  // We need to also handle the case when there are no transactions for the given "accountNumber"
  if (transactionCount === 0) {
    // Now, we need to just get the balance of the "accountNumber"
    // And, we can simply put that balance in whole array and return it
    for (let dayIterator = 1; dayIterator <= numberOfDays; dayIterator += 1) {
      finalAmountOfDay[dayIterator] = balance;
    }
    return finalAmountOfDay;
  }

  for (let transactionIterator = 0; transactionIterator < transactionCount; transactionIterator += 1) {
    const currentTransaction = allTransactions[transactionIterator];
    const currentDate = currentTransaction.dateOfTransaction;
    const Day = currentDate.getDate();

    if (startDay[Day] === undefined) {
      startDay[Day] = currentTransaction.amountBeforeTransaction;
    }
    const amountAfterTransaction = currentTransaction.amountBeforeTransaction + currentTransaction.amount;
    finalAmountOfDay[Day] = amountAfterTransaction;
  }

  for (let dayIterator = 1; dayIterator <= numberOfDays; dayIterator += 1) {
    if (finalAmountOfDay[dayIterator] !== undefined) {
      // go back until we find null
      let dayIteratorSecondPtr = dayIterator - 1;
      while (dayIteratorSecondPtr > 0 && (finalAmountOfDay[dayIteratorSecondPtr] === undefined || finalAmountOfDay[dayIteratorSecondPtr] === null)) {
        finalAmountOfDay[dayIteratorSecondPtr] = startDay[dayIterator];
        dayIteratorSecondPtr -= 1;
      }

      // go to front until we find null
      dayIteratorSecondPtr = dayIterator + 1;
      while (dayIteratorSecondPtr <= numberOfDays && (finalAmountOfDay[dayIteratorSecondPtr] === undefined || finalAmountOfDay[dayIteratorSecondPtr] === null)) {
        finalAmountOfDay[dayIteratorSecondPtr] = finalAmountOfDay[dayIterator];
        dayIteratorSecondPtr += 1;
      }
    }
  }
  return finalAmountOfDay;
};

const getMinBalanceOfLoanAccount = async (startDate, endDate, numberOfDays, accountNumber, balance) => {
  const result = await fetchLoanTransactions(accountNumber, startDate, endDate);

  const allTransactions = result.rows;
  const transactionCount = allTransactions.length;

  const noOfDays = numberOfDays;
  const startDay = new Array(noOfDays + 1);
  const finalAmountOfDay = new Array(noOfDays + 1);

  // We need to also handle the case when there are no transactions for the given "accountNumber"
  if (transactionCount === 0) {
    // Now, we need to just get the balance of the "accountNumber"
    // And, we can simply put that balance in whole array and return it
    for (let dayIterator = 1; dayIterator <= noOfDays; dayIterator += 1) {
      finalAmountOfDay[dayIterator] = balance;
    }
    return finalAmountOfDay;
  }

  for (let transactionIterator = 0; transactionIterator < transactionCount; transactionIterator += 1) {
    const currentTransaction = allTransactions[transactionIterator];

    const currentDate = currentTransaction.dateOfTransaction;

    // const Day = await getNumberOfDays(startDate, currentDate);
    const Day = getNumberOfDays(startDate, currentDate);

    if (startDay[Day] === undefined) {
      startDay[Day] = currentTransaction.amountBeforeTransaction;
    }
    const amountAfterTransaction = currentTransaction.amountBeforeTransaction + currentTransaction.amount;
    finalAmountOfDay[Day] = amountAfterTransaction;
  }

  for (let dayIterator = 1; dayIterator <= noOfDays; dayIterator += 1) {
    if (finalAmountOfDay[dayIterator] !== undefined) {
      // go back until we find null
      let dayIteratorSecondPtr = dayIterator - 1;
      while (dayIteratorSecondPtr > 0 && (finalAmountOfDay[dayIteratorSecondPtr] === undefined || finalAmountOfDay[dayIteratorSecondPtr] == null)) {
        finalAmountOfDay[dayIteratorSecondPtr] = startDay[dayIterator];
        dayIteratorSecondPtr -= 1;
      }

      // go to front until we find null
      dayIteratorSecondPtr = dayIterator + 1;
      while (dayIteratorSecondPtr <= noOfDays && (finalAmountOfDay[dayIteratorSecondPtr] === undefined || finalAmountOfDay[dayIteratorSecondPtr] == null)) {
        finalAmountOfDay[dayIteratorSecondPtr] = finalAmountOfDay[dayIterator];
        dayIteratorSecondPtr += 1;
      }
    }
  }
  return finalAmountOfDay;
};

const loanRepaymentService = async ({ id, amount }) => {
  // If receiver does not have "LOAN" account..
  const accountDetails = await getUserAccountDetailsOfLoanAccount(id);
  const account = accountDetails.rows[0];
  if (!account) {
    return { status: false, message: 'User account does not exist' };
  }

  // Checking whether the repay amount is not excedding 10% of total loan amount
  const totalLoanAmount = account.amount;
  if (amount > 0.1 * totalLoanAmount) {
    return { status: false, message: 'Loan repayment amount excedded' };
  }

  // Checking whether the repay amount is not excedding the remaining loan amount
  let loanAmountRepayed = await getLoanAmountRepayed(account.accountNumber); // It will be negative
  if (loanAmountRepayed == null) { loanAmountRepayed = 0; }
  const remainingAmountToPay = parseInt(parseInt(totalLoanAmount, 10) + parseInt(loanAmountRepayed, 10), 10);
  if (amount > remainingAmountToPay) {
    return { status: false, message: 'Loan repayment amount excedded' };
  }

  await subtractMoney(account.accountNumber, amount, 'LOAN');

  const currentDate = Date(Date.now()).toString();
  const formattedDate = formatDate(currentDate);
  const result = await addTransaction(0, 'LOAN_REPAYMENT', account.accountNumber, null, amount, formattedDate, remainingAmountToPay, null);

  if (result.rowCount === 0) {
    return { status: false, message: 'Loan amount couldn\'t be payed' };
  }
  if (amount === remainingAmountToPay) {
    const updateStatusResponse = await updateLoanStatus(account.accountNumber, 'inactive');
  }
  return { status: true, message: 'Loan amount paid successfully' };
};

const depositMoneyService = async ({ id, accountType, amount }) => {
  // deposit money facility is only applicable in "CURRENT" account
  // i.e., user deposits money to his own account
  const accountDetails = await getUserAccountDetailsOfParticularType(id, accountType);
  const account = accountDetails.rows[0];

  if (!account) {
    return { status: false, message: 'Receiver\'s accounts does not exist' };
  }
  let finalAmount = amount;

  // If account is "CURRENT", then we need to put transaction charge of 0.5% of amount
  const transactionCharge = Math.min((amount / 100) * 0.5, 500);
  await subtractMoney(account.accountNumber, transactionCharge, accountType);
  finalAmount -= transactionCharge;

  const amountBeforeTransaction = account.balance;
  await addMoney(account.accountNumber, finalAmount, accountType);

  const currentDate = Date(Date.now()).toString();
  const formattedDate = formatDate(currentDate);

  await addTransaction(0, 'DEPOSIT', null, account.accountNumber, finalAmount, formattedDate, null, amountBeforeTransaction);

  return { status: true, message: 'Money added' };
};

const withdrawFromBankService = async (req) => {
  const { id, amount, accountType } = req;
  const accountDetails = await getUserAccountDetailsOfParticularType(id, accountType);
  const account = accountDetails.rows[0];

  const currentDate = Date(Date.now()).toString();
  const formattedDate = formatDate(currentDate);
  if (!account) {
    return { status: false, message: 'Account does not exist' };
  }
  if (account.balance < amount) {
    return { status: false, message: 'Amount excedded' };
  }

  // Checking whether total withdraw amount for current day does not exceed by 50000
  const currentDayWithdrawalAmountResult = await getCurrentDayWithdrawalAmount(account.accountNumber, formattedDate);
  const currentDayWithdrawalAmount = currentDayWithdrawalAmountResult.rows[0].sum;
  const totalAmount = parseInt(-1 * currentDayWithdrawalAmount, 10) + parseInt(amount, 10);
  if (totalAmount > 50000) {
    return { status: false, message: 'Money withdrawal amount limit excedded' };
  }

  const amountBeforeTransaction = account.balance;
  await subtractMoney(account.accountNumber, amount, accountType);
  await addTransaction(0, 'WITHDRAW_FROM_BANK', account.accountNumber, null, amount, formattedDate, amountBeforeTransaction, null);

  return { status: true, message: 'Money withdrawn from bank' };
};

const withdrawFromAtmService = async (req) => {
  const {
    id, amount, accountType, cardNumber, cvv,
  } = req;

  const accountDetails = await getUserAccountDetailsOfParticularType(id, accountType);
  const account = accountDetails.rows[0];
  if (!account) {
    return { status: false, message: 'Account does not exist' };
  }

  const cardVerified = await verifyCardDetails(account.accountNumber, cardNumber, cvv);
  if (!cardVerified) {
    return { status: false, message: 'Invalid Details' };
  }

  if (account.balance < amount) {
    return { status: false, message: 'Amount excedded' };
  }

  const currentDate = Date(Date.now());
  const formattedDate = formatDate(currentDate);
  const currentDayWithdrawalAmountResult = await getCurrentDayWithdrawalAmount(account.accountNumber, formattedDate);
  const currentDayWithdrawalAmount = currentDayWithdrawalAmountResult.rows[0].sum;

  const totalAmount = parseInt(-1 * currentDayWithdrawalAmount, 10) + parseInt(amount, 10);
  if (totalAmount > 50000) {
    return { status: false, message: 'Money withdrawal amount limit excedded' };
  }

  // Checking whether total monthly withdraw by atm does not exceed by 5 for a month
  const currentMonthWithdrawCount = await getCurrentMonthAtmWithdrawCount(account.accountNumber, formattedDate);
  let amountBeforeTransaction = account.balance;
  if (currentMonthWithdrawCount >= 5) {
    // Now, charge 500 for each withdraw
    const penaltyForLimit = await subtractMoney(account.accountNumber, 500, accountType);
    if (penaltyForLimit.rowCount === 0) {
      return { status: false, message: 'Could not complete the transaction' };
    }
    amountBeforeTransaction -= 500;
  }

  await subtractMoney(account.accountNumber, amount, accountType);
  await addTransaction(0, 'WITHDRAW_FROM_ATM', account.accountNumber, null, amount, formattedDate, amountBeforeTransaction, null);
  return { status: true, message: 'Money withdrawn from bank using ATM' };
};

const transferMoneyService = async (req) => {
  const { id, receiverUsername, amount } = req;

  const senderUserId = id;
  const senderAccountDetails = await getUserAccountDetailsOfParticularType(senderUserId, 'CURRENT');
  const senderAccount = senderAccountDetails.rows[0];
  senderAccount.accountNumber = senderAccount.accountnumber;

  const receiverUserId = getUserId(receiverUsername);
  const receiverAccountDetails = await getUserAccountDetailsOfParticularType(receiverUserId, 'CURRENT');
  const receiverAccount = receiverAccountDetails.rows[0];
  receiverAccount.accountNumber = receiverAccount.accountnumber;

  if (!senderAccount || !receiverAccount) {
    return { status: false, message: 'Sender account does not exist' };
  }
  if (senderAccount.balance < amount) {
    return { status: false, message: 'Amount excedded' };
  }

  const senderBeforeTransactionAmount = senderAccount.balance;
  const receiverBeforeTransactionAmount = receiverAccount.balance;
  await subtractMoney(senderAccount.accountNumber, amount, 'CURRENT');
  await addMoney(receiverAccount.accountNumber, amount, 'CURRENT');

  let finalAmount = amount;
  // If account is "CURRENT", then we need to put transaction charge of 0.5% of amount
  const transactionCharge = Math.min((amount / 100) * 0.5, 500);
  await subtractMoney(senderAccount.accountNumber, transactionCharge, 'CURRENT');
  finalAmount -= transactionCharge;

  const currentDate = Date(Date.now()).toString();
  const formattedDate = formatDate(currentDate);
  await addTransaction(0, 'TRANSFER', senderAccount.accountNumber, receiverAccount.accountNumber, amount, formattedDate, senderBeforeTransactionAmount, receiverBeforeTransactionAmount);

  return { status: true, message: 'Money transferred' };
};

module.exports = {
  getAllTransactionsOfAccount,
  getLoanAmountRepayed,
  updateLoanStatus,
  getUserAccountDetailsOfLoanAccount,
  getTransactionCountForAccount,
  getUserAccountDetailsOfParticularType,
  getTotalDepositsOfUser,
  subtractMoney,
  subtractMoneyFromLoanAccount,
  addMoney,
  getCurrentDayWithdrawalAmount,
  getCurrentMonthAtmWithdrawCount,
  addTransaction,
  getMinBalance,
  getMinBalanceOfLoanAccount,
  loanRepaymentService,
  depositMoneyService,
  withdrawFromBankService,
  withdrawFromAtmService,
  transferMoneyService,
};
