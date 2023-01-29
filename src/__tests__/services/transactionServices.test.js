/* eslint-disable no-await-in-loop */
/* eslint-disable max-len */
/* eslint-disable import/extensions */
/* eslint-disable global-require */
/* eslint-disable no-undef */
const { fetchUserAccounts } = require('../../models/accountsModel.js');
const {
  createBankAccount, getAllAccountDetails,
} = require('../../services/accountServices.js');
const { getCardDetailsFromAccountNumber } = require('../../services/atmServices.js');
const {
  handleTransactions, getCurrentMonthAtmWithdrawCount, getCurrentDayWithdrawalAmount, subtractMoney, getTotalDepositsOfUser, getMinBalance, getMinBalanceOfLoanAccount,
} = require('../../services/transactionServices.js');
const { signUpUser } = require('../../services/userProfleServices.js');
const { getUserId } = require('../../utils/utils.js');

describe('Transaction services testing', () => {
  const { pool } = require('../../db/connection.js');

  const user1 = {
    username: 'userone',
    name: 'user one',
    email: 'userone@gmail.com',
    password: 'userone',
    phoneNo: '+918080808080',
    dob: '01-01-1987',
    address: 'koramangala',
  };
  const user2 = {
    username: 'usertwo',
    name: 'user two',
    email: 'usertwo@gmail.com',
    password: 'usertwo',
    phoneNo: '+918080808080',
    dob: '01-01-1987',
    address: 'koramangala',
  };
  let userId1;
  let userId2;
  let response1;
  let response2;
  let client;
  // client = await pool.connect();
  //   let userToken1;
  //   let userToken2;

  beforeEach(async () => {
    client = await pool.connect();
    await client.query('DELETE FROM transaction');
    await client.query('DELETE FROM loan_account');
    await client.query('DELETE FROM atm_card');
    await client.query('DELETE FROM accounts');
    await client.query('DELETE FROM users');
    await signUpUser(user1);
    await signUpUser(user2);
    userId1 = getUserId(user1.username);
    userId2 = getUserId(user2.username);
    await createBankAccount({ id: userId1, accountType: 'SAVINGS', amount: 1000000 });
    await createBankAccount({ id: userId2, accountType: 'SAVINGS', amount: 1000000 });
    await createBankAccount({ id: userId1, accountType: 'CURRENT', amount: 1000000 });
    await createBankAccount({ id: userId2, accountType: 'CURRENT', amount: 1000000 });
    await createBankAccount({
      id: userId1, accountType: 'LOAN', loanType: 'CAR', amount: 600000, duration: 4,
    });
    await createBankAccount({
      id: userId2, accountType: 'LOAN', loanType: 'PERSONAL', amount: 600000, duration: 5,
    });
    response1 = await getAllAccountDetails(userId1);
    accNo1 = response1.Savings.accountNumber;
    response2 = await getCardDetailsFromAccountNumber(accNo1);
    card1 = response2.cardNumber;
    expiry1 = response2.expiryDate;
    cvv1 = response2.cvv;
  });

  afterEach(async () => {
    (await client).release();
  });

  afterAll(async () => {
    pool.end();
  });

  it('deposit money transaction should happen', async () => {
    const response = await handleTransactions({ id: userId1, accountType: 'SAVINGS', amount: 2000 });

    expect(response.status).toBe(true);
    expect(typeof response.message).toBe('string');
    expect(response.message).toBe('Money added');
  });

  it('transfer money transaction should not happen, since sender\'s current account does not exist for this user', async () => {
    const response = await handleTransactions({ id: 413532, receiverUsername: 'userthree', amount: -2000 });

    expect(response.status).toBe(false);
    expect(typeof response.message).toBe('string');
    expect(response.message).toBe('Current Account does not exist');
  });

  it('transfer money transaction should not happen, since receiver\'s current account does not exist for this user', async () => {
    const response = await handleTransactions({ id: userId1, receiverUsername: 'userthree', amount: -2000 });

    expect(response.status).toBe(false);
    expect(typeof response.message).toBe('string');
    expect(response.message).toBe('Receiver\'s Current Account does not exist');
  });

  it('transfer money transaction should happen', async () => {
    const response = await handleTransactions({ id: userId1, receiverUsername: 'usertwo', amount: -2000 });

    expect(response.status).toBe(true);
    expect(typeof response.message).toBe('string');
    expect(response.message).toBe('Money transferred');
  });

  it('Withdraw money from atm transaction should happen', async () => {
    const response = await handleTransactions({
      id: userId1, cardNumber: card1, cvv: cvv1, amount: -2000,
    });

    expect(response.status).toBe(true);
    expect(typeof response.message).toBe('string');
    expect(response.message).toBe('Money withdrawn from ATM');
  });

  it('Withdraw money from bank transaction should happen', async () => {
    const response = await handleTransactions({ id: userId1, accountType: 'SAVINGS', amount: -2000 });

    expect(response.status).toBe(true);
    expect(typeof response.message).toBe('string');
    expect(response.message).toBe('Money withdrawn from Bank');
  });

  it('Withdraw money from bank should not happen, since withdrawal amount limit excedded', async () => {
    const response = await handleTransactions({ id: userId1, accountType: 'SAVINGS', amount: -60000 });

    expect(response.status).toBe(false);
    expect(typeof response.message).toBe('string');
    expect(response.message).toBe('Amount excedded');
  });

  it('Loan repayment transaction should happen', async () => {
    const response = await handleTransactions({ id: userId1, accountType: 'LOAN', amount: 22000 });

    expect(response.status).toBe(true);
    expect(typeof response.message).toBe('string');
    expect(response.message).toBe('Loan amount paid successfully');
  });

  it('Loan repayment won\'t happen, since it exceeds more than 10% of loan amount', async () => {
    const response = await handleTransactions({ id: userId1, accountType: 'LOAN', amount: 100000 });
    expect(response.status).toBe(false);
    expect(typeof response.message).toBe('string');
    expect(response.message).toBe('Loan repayment amount excedded');
  });

  it('Withdraw money from atm transaction should happen', async () => {
    const response = await handleTransactions({
      id: userId1, cardNumber: card1, cvv: cvv1, amount: -2000,
    });

    expect(response.status).toBe(true);
    expect(typeof response.message).toBe('string');
    expect(response.message).toBe('Money withdrawn from ATM');
  });

  it('Withdraw money from atm, should not happen, since withdrawal amount is more than 20,000', async () => {
    const response = await handleTransactions({
      id: userId1, cardNumber: card1, cvv: cvv1, amount: -20001,
    });

    expect(response.status).toBe(false);
    expect(typeof response.message).toBe('string');
    expect(response.message).toBe('Amount excedded');
  });

  it('Will give count atm withdraw count', async () => {
    const min = 1;
    let response;
    const max = 5;
    const withdrawCount = Math.floor(Math.random() * (max - min + 1) + min);
    for (let withdrawCounter = 1; withdrawCounter <= withdrawCount; withdrawCounter += 1) {
      response = await handleTransactions({
        id: userId1, cardNumber: card1, cvv: cvv1, amount: -2000,
      });
    }

    response = await getCurrentMonthAtmWithdrawCount(accNo1);

    expect(typeof response).toBe('number');
    expect(response).toBe(withdrawCount);
  });

  it('Will give withdraw amount for current day', async () => {
    const min = 1;
    const max = 5;
    const minAmount = 1;
    const maxAmount = 2000;
    let response;
    const withdrawCount = Math.floor(Math.random() * (max - min + 1) + min);
    let withdrawSum = 0;
    for (let withdrawCounter = 1; withdrawCounter <= withdrawCount; withdrawCounter += 1) {
      const withdrawAmount = Math.floor(Math.random() * (maxAmount - minAmount + 1) + minAmount);
      response = await handleTransactions({
        id: userId1, cardNumber: card1, cvv: cvv1, amount: -1 * withdrawAmount,
      });
      withdrawSum += (-1 * withdrawAmount);
    }

    response = await getCurrentDayWithdrawalAmount(accNo1);
    expect(response.rows[0].sum).toBe(String(withdrawSum));
  });

  it('withdraw money from atm more than 5 times, \'500\' penalty will be imposed for 6th withdraw', async () => {
    let response;
    for (let withdrawCounter = 1; withdrawCounter <= 6; withdrawCounter += 1) {
      response = await handleTransactions({
        id: userId1, cardNumber: card1, cvv: cvv1, amount: -2000,
      });
    }

    expect(response.status).toBe(true);
    expect(response.message).toBe('Money withdrawn from ATM');

    response = await getCurrentDayWithdrawalAmount(accNo1);
    const balanceResponse = await client.query(`SELECT balance FROM accounts WHERE "accountNumber" = ${accNo1} LIMIT 1`);
    const { balance } = balanceResponse.rows[0];
    expect(1000000 - (-1 * parseInt(response.rows[0].sum, 10)) - balance).toBe(500);
  });

  it('Should get deposits of the user', async () => {
    const userRows = await fetchUserAccounts(userId1);
    const response = await getTotalDepositsOfUser(userRows);

    const totalDepositResponse = await client.query(`SELECT SUM(balance) FROM accounts WHERE "userId" = ${userId1}`);
    const totalDeposits = totalDepositResponse.rows[0].sum;
    expect(response).toBe(parseInt(totalDeposits, 10));
  });
});
