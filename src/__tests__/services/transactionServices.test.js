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
  //   let userToken1;
  //   let userToken2;

  beforeAll(async () => {
    await pool.query('DELETE FROM transaction');
    await pool.query('DELETE FROM loan_account');
    await pool.query('DELETE FROM atm_card');
    await pool.query('DELETE FROM accounts');
    await pool.query('DELETE FROM users');
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

  afterAll(async () => {
    pool.end();
  });

  it('Should deposit money in savings account', async () => {
    const response = await handleTransactions({ id: userId1, accountType: 'SAVINGS', amount: 2000 });
    expect(response.status).toBe(true);
    expect(response.message).toBe('Money added');
  });

  it('Should transfer money', async () => {
    const response = await handleTransactions({ id: userId1, receiverUsername: 'usertwo', amount: -2000 });
    expect(response.status).toBe(true);
    expect(response.message).toBe('Money transferred');
  });

  it('Should withdraw money from atm', async () => {
    const response = await handleTransactions({
      id: userId1, cardNumber: card1, cvv: cvv1, amount: -2000,
    });
    expect(response.status).toBe(true);
    expect(response.message).toBe('Money withdrawn from ATM');
  });

  it('Should withdraw money from bank', async () => {
    const response = await handleTransactions({ id: userId1, accountType: 'SAVINGS', amount: -2000 });
    expect(response.status).toBe(true);
    expect(response.message).toBe('Money withdrawn from Bank');
  });

  it('Should not withdraw money from bank', async () => {
    const response = await handleTransactions({ id: userId1, accountType: 'SAVINGS', amount: -60000 });
    expect(response.status).toBe(false);
    expect(response.message).toBe('Amount excedded');
  });

  it('Should not withdraw money from bank', async () => {
    const response = await handleTransactions({ id: userId1, accountType: 'SAVINGS', amount: -22000 });
    expect(response.status).toBe(false);
    expect(response.message).toBe('Amount excedded');
  });

  it('Should repay the loan', async () => {
    const response = await handleTransactions({ id: userId1, accountType: 'LOAN', amount: 22000 });
    expect(response.status).toBe(true);
    expect(response.message).toBe('Loan amount paid successfully');
  });

  it('Should not repay the loan', async () => {
    const response = await handleTransactions({ id: userId1, accountType: 'LOAN', amount: 100000 });
    expect(response.status).toBe(false);
    expect(response.message).toBe('Loan repayment amount excedded');
  });

  it('Should give count equal to 1', async () => {
    const response = await getCurrentMonthAtmWithdrawCount(accNo1);
    expect(response).toBe(1);
  });

  it('Should give count equal to 1', async () => {
    const response = await getCurrentMonthAtmWithdrawCount(accNo1);
    expect(response).toBe(1);
  });

  it('Should give amount equal to 4000', async () => {
    const response = await getCurrentDayWithdrawalAmount(accNo1);
    expect(response.rows[0].sum).toBe('-4000');
  });

  it('Should withdraw money from atm more than 5 times', async () => {
    let response;
    for (let withdrawCounter = 1; withdrawCounter <= 5; withdrawCounter += 1) {
      response = await handleTransactions({
        id: userId1, cardNumber: card1, cvv: cvv1, amount: -2000,
      });
    }
    expect(response.status).toBe(true);
    expect(response.message).toBe('Money withdrawn from ATM');
  });

  it('Should not subtract money from balance', async () => {
    const response = await subtractMoney(1234567892, 5000, 'CURRENT');
    expect(response.rowCount).toBe(0);
  });

  it('Should get deposits of the user', async () => {
    const userRows = await fetchUserAccounts(userId1);
    const response = await getTotalDepositsOfUser(userRows);
    expect(response).toBeDefined();
  });

  it('Should calculate eod balance for the whole month', async () => {
    const response = await getMinBalance(1, 2023, response1.Savings.accountNumber, response1.Savings.balance, 31);
    expect(response.length).toBeGreaterThan(27);
  });

  it('Should calculate eod balance for 6 month for loan account', async () => {
    const response = await getMinBalanceOfLoanAccount('2023-01-10', '2023-01-20', 11, response1.Loan.accountNumber, response1.Savings.balance);
    expect(response.length).toBeGreaterThan(11);
  });
});
