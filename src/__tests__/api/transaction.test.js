/* eslint-disable prefer-destructuring */
/* eslint-disable max-len */
/* eslint-disable global-require */
/* eslint-disable import/no-unresolved */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/extensions */
/* eslint-disable no-undef */
// import supertest from 'supertest';
// import app from '../../server.js';
const supertest = require('supertest');
const app = require('../../app.js');
const { createBankAccount } = require('../../services/accountServices.js');
const { getCardDetailsFromAccountNumber } = require('../../services/atmServices.js');
const { getUserAccountDetailsOfParticularType } = require('../../services/transactionServices.js');
const { signUpUser, signInUser } = require('../../services/userProfleServices.js');
const { getUserId } = require('../../utils/utils.js');
const { pool } = require('../../db/connection.js');

describe('Testing transaction api', () => {
  let token1;
  let token2;
  let useroneSavingsAccountDetails;
  let usertwoSavingsAccountDetails;
  let useroneCurrentAccountDetails;
  let usertwoCurrentAccountDetails;
  let useroneCardDetails;
  let usertwoCardDetails;
  let request;
  let result;
  let client;
  beforeEach(async () => {
    client = await pool.connect();
    await client.query('DELETE FROM transaction');
    await client.query('DELETE FROM loan_account');
    await client.query('DELETE FROM atm_card');
    await client.query('DELETE FROM accounts');
    await client.query('DELETE FROM users');
    await signUpUser({
      username: 'userone',
      name: 'user new',
      email: 'userone@test.com',
      password: 'userone',
      phoneNo: '+912222233333',
      dob: '01-01-1993',
      address: 'dummy address number 1',
    });
    await signUpUser({
      username: 'usertwo',
      name: 'user new',
      email: 'usertwo@test.com',
      password: 'usertwo',
      phoneNo: '+912222233333',
      dob: '01-01-1993',
      address: 'dummy address number 1',
    });
    const resp1 = await signInUser({ username: 'userone', password: 'userone' });
    token1 = resp1.token;
    const resp2 = await signInUser({ username: 'usertwo', password: 'usertwo' });
    token2 = resp2.token;
    await createBankAccount({ id: getUserId('userone'), accountType: 'CURRENT', amount: 1000000 });
    await createBankAccount({ id: getUserId('userone'), accountType: 'SAVINGS', amount: 500000 });
    await createBankAccount({
      id: getUserId('userone'), accountType: 'LOAN', amount: 600000, duration: 5, loanType: 'CAR',
    });
    await createBankAccount({ id: getUserId('usertwo'), accountType: 'CURRENT', amount: 1000000 });
    await createBankAccount({ id: getUserId('usertwo'), accountType: 'SAVINGS', amount: 500000 });
    await createBankAccount({
      id: getUserId('usertwo'), accountType: 'LOAN', amount: 600000, duration: 5, loanType: 'HOME',
    });
    useroneSavingsAccountDetails = await getUserAccountDetailsOfParticularType(getUserId('userone'), 'SAVINGS');
    useroneCardDetails = await getCardDetailsFromAccountNumber(BigInt(useroneSavingsAccountDetails.accountNumber));
    useroneCurrentAccountDetails = await getUserAccountDetailsOfParticularType(getUserId('userone'), 'CURRENT');
  });
  afterEach(async () => {
    (await client).release();
  });

  it('Test to deposit money in user\'s account', async () => {
    request = supertest(app);
    const response = await request.put('/api/account').send({
      amount: 5000,
      account_type: 'CURRENT',
    }).set('Authorization', `Bearer ${token1}`);
    expect(response.status).toBe(200);
    expect(typeof response.body.message).toBe('string');
    expect(response.body.message).toBe('Money added');
    token2 = response.body.token;
  });

  it('Test to transfer money from userone to usertwo account', async () => {
    request = supertest(app);
    const response = await request.put('/api/account').send({
      amount: -5000,
      receiver_username: 'usertwo',
    }).set('Authorization', `Bearer ${token1}`);
    expect(response.status).toBe(200);
    expect(typeof response.body.message).toBe('string');
    expect(response.body.message).toBe('Money transferred');
    token2 = response.body.token;
  });

  it('Test to withdraw money from atm', async () => {
    request = supertest(app);
    const response = await request.put('/api/account').send({
      amount: -5000,
      card_number: useroneCardDetails.cardNumber,
      cvv: useroneCardDetails.cvv,
    }).set('Authorization', `Bearer ${token1}`);
    expect(response.status).toBe(200);
    expect(typeof response.body.message).toBe('string');
    expect(response.body.message).toBe('Money withdrawn from ATM');
  });

  it('Test to withdraw money from bank', async () => {
    request = supertest(app);

    const response = await request.put('/api/account').send({
      amount: -5000,
      account_type: 'CURRENT',
    }).set('Authorization', `Bearer ${token1}`);

    expect(response.status).toBe(200);
    expect(typeof response.body.message).toBe('string');
    expect(response.body.message).toBe('Money withdrawn from Bank');
  });

  it('Test to get account details', async () => {
    request = supertest(app);

    const response = await request.get('/api/account').send().set('Authorization', `Bearer ${token1}`);
    const savingsAccountDetails = response.body.Savings;
    const currentAccountDetails = response.body.Current;
    const loanAccountDetails = response.body.Loan;

    expect(response.status).toBe(200);
    expect(typeof savingsAccountDetails.accountNumber).toBe('string');
    expect(typeof savingsAccountDetails.accountType).toBe('string');
    expect(typeof savingsAccountDetails.userId).toBe('number');
    expect(typeof savingsAccountDetails.createdAt).toBe('string');
    expect(typeof savingsAccountDetails.balance).toBe('number');

    expect(typeof currentAccountDetails.accountNumber).toBe('string');
    expect(typeof currentAccountDetails.accountType).toBe('string');
    expect(typeof currentAccountDetails.userId).toBe('number');
    expect(typeof currentAccountDetails.createdAt).toBe('string');
    expect(typeof currentAccountDetails.balance).toBe('number');

    expect(typeof loanAccountDetails.accountNumber).toBe('string');
    expect(typeof loanAccountDetails.accountType).toBe('string');
    expect(typeof loanAccountDetails.userId).toBe('number');
    expect(typeof loanAccountDetails.createdAt).toBe('string');
    expect(typeof loanAccountDetails.balance).toBe('number');
    expect(typeof loanAccountDetails.loanType).toBe('string');
    expect(typeof loanAccountDetails.interest).toBe('number');
    expect(typeof loanAccountDetails.amount).toBe('number');
    expect(typeof loanAccountDetails.duration).toBe('number');
    expect(typeof loanAccountDetails.status).toBe('string');

    // Can cross check it, by making a query on DB
  });

  it('Test to get passbook of user', async () => {
    request = supertest(app);

    const response1 = await request.put('/api/account').send({
      amount: -5000,
      account_type: 'CURRENT',
    }).set('Authorization', `Bearer ${token1}`);

    const response2 = await request.get('/api/passbook').send({
      account_type: 'CURRENT',
    }).set('Authorization', `Bearer ${token1}`);

    const useroneCurrentAccountNumber = useroneCurrentAccountDetails.accountNumber;

    const res1 = await pool.query(`SELECT * from transaction where "accountNo" = ${useroneCurrentAccountNumber} ORDER BY "dateOfTransaction" LIMIT 1`);
    const firstTransaction = res1.rows[0];

    expect(typeof response2.body[0].transactionNumber).toBe('string');
    expect(typeof response2.body[0].transactionType).toBe('string');
    expect(typeof response2.body[0].amount).toBe('number');
    expect(typeof response2.body[0].dateOfTransaction).toBe('string');
    expect(typeof response2.body[0].amountBeforeTransaction).toBe('number');
    expect(typeof response2.body[0].accountNo).toBe('string');

    expect(response2.status).toBe(200);
    expect(response2.body[0].transactionNumber).toBe(firstTransaction.transactionNumber);
    expect(response2.body[0].transactionType).toBe(firstTransaction.transactionType);
    expect(response2.body[0].amount).toBe(firstTransaction.amount);
    expect(response2.body[0].dateOfTransaction).toBe(firstTransaction.dateOfTransaction.toJSON());
    expect(response2.body[0].amountBeforeTransaction).toBe(firstTransaction.amountBeforeTransaction);
    expect(response2.body[0].accountNo).toBe(firstTransaction.accountNo);
  });
});
