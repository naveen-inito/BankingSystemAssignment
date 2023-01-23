/* eslint-disable max-len */
/* eslint-disable import/extensions */
/* eslint-disable global-require */
/* eslint-disable no-undef */
const { fetchAccountDetailsFromIdAndType, fetchAccountsFromType } = require('../../models/accountsModel.js');
const { fetchActiveLoanAccountsFromAccountNumber } = require('../../models/loanAccountModel.js');
const {
  createBankAccount, getAllAccountDetails, validateAgeForAcccount, getLoanInterest, addInterestOnLoanAccount, jobForCalculatingInterestOnSavingAccount, calculateNrvAndDeductPenalty,
} = require('../../services/accountServices.js');
const { handleTransactions } = require('../../services/transactionServices.js');
const { signUpUser } = require('../../services/userProfleServices.js');
const { getUserId, formatDate } = require('../../utils/utils.js');

describe('Account services testing', () => {
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
  let savingsAccountNumber1;
  let currentAccountNumber1;
  let loanAccountNumber1;
  let savingsAccountNumber2;
  let currentAccountNumber2;
  let loanAccountNumber2;

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
  });

  afterAll(async () => {
    pool.end();
  });

  it('user\'s savings account should be created', async () => {
    const response = await createBankAccount({ id: userId1, accountType: 'SAVINGS', amount: '1000000' });
    expect(response.status).toBe(true);
    expect(response.message).toBe('Account Created');
  });

  it('user\'s savings account should be created', async () => {
    const response = await createBankAccount({ id: userId2, accountType: 'SAVINGS', amount: '1000000' });
    expect(response.status).toBe(true);
    expect(response.message).toBe('Account Created');
  });

  it('Fetch user\'s savings account', async () => {
    const response = await fetchAccountsFromType('SAVINGS');
    expect(response.rows.length).toBe(2);
  });

  it('user\'s current account should be created', async () => {
    const response = await createBankAccount({ id: userId1, accountType: 'CURRENT', amount: '500000' });
    expect(response.status).toBe(true);
    expect(response.message).toBe('Account Created');
  });
  it('user\'s current account should be created', async () => {
    const response = await createBankAccount({ id: userId2, accountType: 'CURRENT', amount: '500000' });
    expect(response.status).toBe(true);
    expect(response.message).toBe('Account Created');
  });

  it('user\'s loan account should be created', async () => {
    const response = await createBankAccount({
      id: userId1, accountType: 'LOAN', amount: '520000', loanType: 'CAR', duration: 5,
    });
    expect(response.status).toBe(true);
    expect(response.message).toBe('Account Created');
  });

  it('user\'s loan account should be created', async () => {
    const response = await createBankAccount({
      id: userId2, accountType: 'LOAN', amount: '520000', loanType: 'CAR', duration: 5,
    });
    expect(response.status).toBe(true);
    expect(response.message).toBe('Account Created');
  });

  it('user\'s details should be provided', async () => {
    const response = await getAllAccountDetails(userId1);
    expect(response.Savings).toBeDefined();
    expect(response.Current).toBeDefined();
    expect(response.Loan).toBeDefined();
    savingsAccountNumber1 = response.Savings.accountNumber;
    currentAccountNumber1 = response.Current.accountNumber;
    loanAccountNumber1 = response.Loan.accountNumber;
  });

  it('user\'s details should be provided', async () => {
    const response = await getAllAccountDetails(userId2);
    expect(response.Savings).toBeDefined();
    expect(response.Current).toBeDefined();
    expect(response.Loan).toBeDefined();
    savingsAccountNumber2 = response.Savings.accountNumber;
    currentAccountNumber2 = response.Current.accountNumber;
    loanAccountNumber2 = response.Loan.accountNumber;
  });

  it('validating user\'s age for account creation', async () => {
    const response1 = await validateAgeForAcccount(21, 'LOAN');
    const response2 = await validateAgeForAcccount(21, 'SAVINGS');
    const response3 = await validateAgeForAcccount(21, 'CURRENT');
    const response4 = await validateAgeForAcccount(25, 'LOAN');
    expect(response1.status).toBe(false);
    expect(response2.status).toBe(true);
    expect(response3.status).toBe(true);
    expect(response4.status).toBe(true);
  });

  it('test for getting loan interest percentage', async () => {
    const response1 = getLoanInterest('CAR');
    const response2 = getLoanInterest('HOME');
    const response3 = getLoanInterest('BUS');
    expect(response1.status).toBe(true);
    expect(response2.status).toBe(true);
    expect(response3.status).toBe(false);
  });

  it('test for calculating interest on loan account (cron)', async () => {
    const loanAccount = await fetchActiveLoanAccountsFromAccountNumber(loanAccountNumber1);
    const response = await addInterestOnLoanAccount(loanAccount);
    expect(response.status).toBe(false);
    expect(response.message).toBe('Loan is created on this date only');
  });

  it('test for calculating interest on loan account (mock date) (cron)', async () => {
    // changing the creation date of loan account to calculate the interest
    await pool.query(`UPDATE accounts SET "createdAt" = '2010-01-23' WHERE "accountNumber" = ${loanAccountNumber1}`);
    const RealDate = Date.now;
    // Date.now = jest.fn(() => new Date(Date.UTC(2010, 6, 23)).valueOf());
    Date.now = jest.fn(() => Date.parse('2010-07-23'));
    const currentDate = Date(Date.now()).toString();
    const formattedDate = formatDate(currentDate);
    console.log(currentDate,", ",formattedDate)

    const response1 = await handleTransactions({ id: userId1, accountType: 'LOAN', amount: 22000 });
    expect(response1.status).toBe(true);
    expect(response1.message).toBe('Loan amount paid successfully');
    await pool.query(`UPDATE transaction SET "dateOfTransaction" = ' 2010-07-23 00:00:00.000000' WHERE "accountNo" = ${loanAccountNumber1}`);

    const loanAccount = await fetchActiveLoanAccountsFromAccountNumber(loanAccountNumber1);
    const response2 = await addInterestOnLoanAccount(loanAccount);
    expect(response2.status).toBe(true);
    expect(response2.message).toBe('Interest added');
    Date.now = RealDate;
  });

  it('test for calculating interest on loan account (cron) (loan is defaulted)', async () => {
    // changing the creation date of loan account to calculate the interest
    await pool.query(`UPDATE accounts SET "createdAt" = '2004-07-23' WHERE "accountNumber" = ${loanAccountNumber2}`);
    const loanAccount = await fetchActiveLoanAccountsFromAccountNumber(loanAccountNumber2);
    console.log(loanAccount);
    const response = await addInterestOnLoanAccount(loanAccount);
    expect(response.status).toBe(false);
    expect(response.message).toBe('Loan is defaulted');
  });

  it('test for calculating interest on savings account (cron)', async () => {
    await pool.query(`UPDATE accounts SET balance = 2000 WHERE "userId" = ${userId1} AND "accountType" = 'SAVINGS'`);
    const savingsAccount = await fetchAccountDetailsFromIdAndType(userId1, 'SAVINGS');
    const response = await jobForCalculatingInterestOnSavingAccount(savingsAccount);
    expect(response.status).toBe(true);
    expect(response.message).toBe('Penalty imposed');
    await pool.query(`UPDATE accounts SET balance = 10000 WHERE "userId" = ${userId1} AND "accountType" = 'SAVINGS'`);
  });

  it('test for calculating interest on savings account (cron)', async () => {
    const savingsAccount = await fetchAccountDetailsFromIdAndType(userId1, 'SAVINGS');
    const response = await jobForCalculatingInterestOnSavingAccount(savingsAccount);
    expect(response.status).toBe(false);
    expect(response.message).toBe('Penalty not imposed');
  });

  it('test for deducting penalty on current account (cron)', async () => {
    const currentAccount = await fetchAccountDetailsFromIdAndType(userId1, 'CURRENT');
    const response = await calculateNrvAndDeductPenalty(currentAccount);
    expect(response.message1).toBe('Penalty imposed, since has less than 3 transactions');
    expect(response.message2).toBe('Penalty not imposed, since NRV is maintained');
  });
});
