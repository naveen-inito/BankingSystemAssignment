/* eslint-disable prefer-const */
/* eslint-disable no-param-reassign */
/* eslint-disable no-await-in-loop */
/* eslint-disable max-len */
const { deductFromBalance, fetchAccountDetailsFromIdAndType } = require('../models/accountsModel');
const { getLoanAccountDetails } = require('../models/loanAccountModel');
const {
  getSumOfAmountFromAccountNoAndTransactionType, fetchParticularMonthTransactionCountOfAccount, fetchParticularDayWithdrawAmount, fetchParticularMonthAtmWithdrawCount, fetchParticularMonthTransactions, fetchLoanTransactions, transferMoney, withdrawFromAtm, withdrawFromBank, loanRepayment, depositMoney,
} = require('../models/transactionModel');
const {
  TRANSACTION_TYPES, ACCOUNT_TYPES, TRANSACTION_CHARGE_RATE, MAXIMUM_DAILY_WITHDRAW_AMOUNT, ONE_TIME_WITHDRAW_LIMIT, MAXIMUM_TRANSACTION_CHARGE_AMOUNT,
} = require('../utils/constants');
const {
  getNumberOfDays, generateTransactionNumber, getUserId,
} = require('../utils/utils');
const { verifyCardDetails } = require('./atmServices');

const getTransactionCountForAccount = async (accountNumber, formattedDate) => {
  const d = new Date(formattedDate);
  const month = `${d.getMonth() + 1}`;
  const year = d.getFullYear();
  const result = await fetchParticularMonthTransactionCountOfAccount(accountNumber, month, year);
  return result;
};

const getUserAccountDetailsOfParticularType = async (userId, accountType) => {
  const result = await fetchAccountDetailsFromIdAndType(userId, accountType);
  return result;
};

const getTotalDepositsOfUser = (userRows) => {
  const len = userRows.length;
  let totalSum = 0;
  for (let rowIterator = 0; rowIterator < len; rowIterator += 1) {
    totalSum += userRows[rowIterator].balance;
  }
  return totalSum;
};

const subtractMoney = async (accountNumber, amount, accountType) => {
  const result = await deductFromBalance(amount, accountNumber, accountType);
  return result;
};

const getCurrentDayWithdrawalAmount = async (accountNumber) => {
  const d = new Date(Date.now());
  const month = `${d.getMonth() + 1}`;
  const day = `${d.getDate()}`;
  const year = d.getFullYear();
  const result = await fetchParticularDayWithdrawAmount(accountNumber, day, month, year);
  return result;
};

const getCurrentMonthAtmWithdrawCount = async (accountNumber) => {
  const d = new Date(Date.now());
  const month = `${d.getMonth() + 1}`;
  const year = d.getFullYear();
  const result = await fetchParticularMonthAtmWithdrawCount(accountNumber, month, year);
  return result;
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
  console.log(transactionCount,", ",startDate, ", ", endDate, ", ", typeof(startDate),", ",typeof(endDate));

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
  const account = await getLoanAccountDetails(id);
  if (!account) {
    return { status: false, message: 'User account does not exist' };
  }

  // Checking whether the repay amount is not excedding 10% of total loan amount
  const totalLoanAmount = account.amount;
  if (amount > 0.1 * totalLoanAmount) {
    return { status: false, message: 'Loan repayment amount excedded' };
  }

  // Checking whether the repay amount is not excedding the remaining loan amount
  let loanAmountRepayed = await getSumOfAmountFromAccountNoAndTransactionType(account.accountNumber, TRANSACTION_TYPES.LOAN_REPAYMENT); // It will be negative
  if (loanAmountRepayed == null) { loanAmountRepayed = 0; }
  const remainingAmountToPay = parseInt(parseInt(totalLoanAmount, 10) + parseInt(loanAmountRepayed, 10), 10);
  if (amount > remainingAmountToPay) {
    return { status: false, message: 'Loan repayment amount excedded' };
  }

  const transactionType = TRANSACTION_TYPES.LOAN_REPAYMENT;
  const accountType = ACCOUNT_TYPES.LOAN;
  const senderTransactionNumber = generateTransactionNumber();
  const loanRepaymentResponse = await loanRepayment({
    accountNumber: account.accountNumber,
    transactionType,
    amount,
    remainingAmountToPay,
    accountType,
    senderTransactionNumber,
  });
  return loanRepaymentResponse;
};

const depositMoneyService = async ({ id, accountType, amount }) => {
  const account = await getUserAccountDetailsOfParticularType(id, accountType);

  // console.log(accountDetails)
  if (!account) {
    return { status: false, message: 'Receiver\'s accounts does not exist' };
  }
  const receiverTransactionNumber = generateTransactionNumber();
  const amountBeforeTransaction = account.balance;
  const transactionType = TRANSACTION_TYPES.DEPOSIT;

  // If account is "CURRENT", then we need to put transaction charge of 0.5% of amount
  const transactionCharge = Math.min((amount / 100) * TRANSACTION_CHARGE_RATE, MAXIMUM_TRANSACTION_CHARGE_AMOUNT);

  const depositMoneyResponse = await depositMoney({
    accountNumber: account.accountNumber,
    transactionCharge,
    transactionType,
    accountType,
    amount,
    finalAmount: amount - transactionCharge,
    receiverTransactionNumber,
    amountBeforeTransaction,
  });
  return depositMoneyResponse;
};

const withdrawFromBankService = async (req) => {
  const { id, amount, accountType } = req;
  const account = await getUserAccountDetailsOfParticularType(id, accountType);

  if (!account) {
    return { status: false, message: 'Account does not exist' };
  }
  if (account.balance < amount || (accountType === ACCOUNT_TYPES.SAVINGS && amount > ONE_TIME_WITHDRAW_LIMIT)) {
    return { status: false, message: 'Amount excedded' };
  }

  const currentDayWithdrawalAmountResult = await getCurrentDayWithdrawalAmount(account.accountNumber);
  const currentDayWithdrawalAmount = currentDayWithdrawalAmountResult.rows[0].sum;
  const totalAmount = parseInt(-1 * currentDayWithdrawalAmount, 10) + parseInt(amount, 10);
  if (totalAmount > MAXIMUM_DAILY_WITHDRAW_AMOUNT) {
    return { status: false, message: 'Money withdrawal amount limit excedded' };
  }

  const amountBeforeTransaction = account.balance;
  const senderTransactionNumber = generateTransactionNumber();
  const transactionType = TRANSACTION_TYPES.WITHDRAW_FROM_BANK;
  const withdrawFromBankResponse = await withdrawFromBank({
    accountNumber: account.accountNumber,
    amount,
    accountType,
    transactionType,
    amountBeforeTransaction,
    senderTransactionNumber,
  });
  return withdrawFromBankResponse;
};

const withdrawFromAtmService = async (req) => {
  const {
    id, amount, accountType, cardNumber, cvv,
  } = req;

  const account = await getUserAccountDetailsOfParticularType(id, accountType);
  if (!account) {
    return { status: false, message: 'Account does not exist' };
  }

  const cardVerified = await verifyCardDetails(account.accountNumber, cardNumber, cvv);
  if (!cardVerified) {
    return { status: false, message: 'Invalid Details' };
  }

  if (account.balance < amount || amount > ONE_TIME_WITHDRAW_LIMIT) {
    return { status: false, message: 'Amount excedded' };
  }

  const currentDayWithdrawalAmountResult = await getCurrentDayWithdrawalAmount(account.accountNumber);
  const currentDayWithdrawalAmount = currentDayWithdrawalAmountResult.rows[0].sum;

  const totalAmount = parseInt(-1 * currentDayWithdrawalAmount, 10) + parseInt(amount, 10);
  if (totalAmount > MAXIMUM_DAILY_WITHDRAW_AMOUNT) {
    return { status: false, message: 'Money withdrawal amount limit excedded' };
  }

  // Checking whether total monthly withdraw by atm does not exceed by 5 for a month
  const currentMonthWithdrawCount = await getCurrentMonthAtmWithdrawCount(account.accountNumber);
  let amountBeforeTransaction = account.balance;

  const senderTransactionNumber = generateTransactionNumber();
  const transactionType = TRANSACTION_TYPES.WITHDRAW_FROM_ATM;
  const withdrawFromAtmResponse = await withdrawFromAtm({
    accountNumber: account.accountNumber,
    amount,
    accountType,
    transactionType,
    amountBeforeTransaction,
    senderTransactionNumber,
    currentMonthWithdrawCount,
  });
  return withdrawFromAtmResponse;
};

const transferMoneyService = async (req) => {
  const { id, receiverUsername, amount } = req;

  const senderUserId = id;
  const senderAccount = await getUserAccountDetailsOfParticularType(senderUserId, ACCOUNT_TYPES.CURRENT);

  const receiverUserId = getUserId(receiverUsername);
  const receiverAccount = await getUserAccountDetailsOfParticularType(receiverUserId, ACCOUNT_TYPES.CURRENT);

  if (!senderAccount) {
    return { status: false, message: 'Current Account does not exist' };
  }
  if (!receiverAccount) {
    return { status: false, message: 'Receiver\'s Current Account does not exist' };
  }

  // If account is "CURRENT", then we need to put transaction charge of 0.5% of amount
  const transactionCharge = Math.min((amount / 100) * TRANSACTION_CHARGE_RATE, MAXIMUM_TRANSACTION_CHARGE_AMOUNT);
  if ((senderAccount.balance + transactionCharge) <= amount) {
    return { status: false, message: 'Amount excedded' };
  }

  const senderBeforeTransactionAmount = senderAccount.balance - transactionCharge;
  const receiverBeforeTransactionAmount = receiverAccount.balance;

  const senderTransactionNumber = generateTransactionNumber();
  const receiverTransactionNumber = generateTransactionNumber();
  const transferMoneyResponse = await transferMoney({
    senderAccountNumber: senderAccount.accountNumber,
    receiverAccountNumber: receiverAccount.accountNumber,
    amount,
    accountType: ACCOUNT_TYPES.CURRENT,
    transactionType: TRANSACTION_TYPES.TRANSFER,
    transactionCharge,
    senderBeforeTransactionAmount,
    receiverBeforeTransactionAmount,
    senderTransactionNumber,
    receiverTransactionNumber,
  });
  return transferMoneyResponse;
};

const handleTransactions = async ({
  id, amount, accountType, cardNumber, cvv, receiverUsername,
}) => {
  if (amount < 0) {
    amount *= -1;
    // It could be transfer or withdraw from bank or withdraw from atm
    if (receiverUsername) {
      // It is money transfer
      const transferMoneyServiceResponse = await transferMoneyService({ id, amount, receiverUsername });
      return transferMoneyServiceResponse;
    }
    if (cardNumber && cvv) {
      // It is withdraw from atm
      accountType = ACCOUNT_TYPES.SAVINGS;
      const withdrawFromAtmServiceResponse = await withdrawFromAtmService({
        id, amount, cardNumber, cvv, accountType,
      });
      return withdrawFromAtmServiceResponse;
    }
    if (accountType) {
      // It is withdraw from bank
      const withdrawFromBankServiceResponse = await withdrawFromBankService({ id, amount, accountType });
      return withdrawFromBankServiceResponse;
    }
  }
  if (amount > 0) {
    // It could be deposit or loan repayment
    if (accountType === ACCOUNT_TYPES.LOAN) {
      // It is loan repayment
      const loanRepaymentResponse = await loanRepaymentService({ id, amount, accountType });
      return loanRepaymentResponse;
    }
    if (accountType && amount) {
      const depositMoneyResponse = await depositMoneyService({ id, amount, accountType });
      return depositMoneyResponse;
    }
  }
  return { status: false, message: 'Transaction could not be done' };
};

module.exports = {
  getTransactionCountForAccount,
  getUserAccountDetailsOfParticularType,
  getTotalDepositsOfUser,
  subtractMoney,
  getCurrentDayWithdrawalAmount,
  getCurrentMonthAtmWithdrawCount,
  getMinBalance,
  getMinBalanceOfLoanAccount,
  loanRepaymentService,
  depositMoneyService,
  withdrawFromBankService,
  withdrawFromAtmService,
  transferMoneyService,
  handleTransactions,
};
