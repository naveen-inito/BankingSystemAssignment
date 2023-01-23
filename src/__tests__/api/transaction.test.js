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
  beforeAll(async () => {
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
    await createBankAccount({ id: getUserId('userone'), accountType: 'CURRENT', amount: 100000 });
    await createBankAccount({ id: getUserId('userone'), accountType: 'SAVINGS', amount: 50000 });
    await createBankAccount({ id: getUserId('usertwo'), accountType: 'CURRENT', amount: 100000 });
    await createBankAccount({ id: getUserId('usertwo'), accountType: 'SAVINGS', amount: 50000 });
    useroneSavingsAccountDetails = await getUserAccountDetailsOfParticularType(getUserId('userone'), 'SAVINGS');
    useroneCardDetails = await getCardDetailsFromAccountNumber(BigInt(useroneSavingsAccountDetails.accountNumber));
  });
  afterAll(async () => {
    (await client).release();
  });

  it('Test to deposit money in user\'s account', async () => {
    request = supertest(app);
    const response = await request.put('/api/account').send({
      amount: 5000,
      account_type: 'CURRENT',
    }).set('Authorization', `Bearer ${token1}`);
    expect(response.status).toBe(200);
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
    expect(response.body.message).toBe('Money withdrawn from ATM');
  });

  it('Test to withdraw money from bank', async () => {
    request = supertest(app);
    const response = await request.put('/api/account').send({
      amount: -5000,
      account_type: 'CURRENT',
    }).set('Authorization', `Bearer ${token1}`);
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Money withdrawn from Bank');
  });

  it('Test to get account details', async () => {
    request = supertest(app);
    const response = await request.get('/api/account').send().set('Authorization', `Bearer ${token1}`);
    expect(response.status).toBe(200);
  });

  it('Test to get passbook of user', async () => {
    request = supertest(app);
    const response = await request.get('/api/passbook').send({
      account_type: 'SAVINGS',
    }).set('Authorization', `Bearer ${token1}`);
    expect(response.status).toBe(200);
  });
  it('Test to get passbook of user', async () => {
    request = supertest(app);
    const response = await request.get('/api/passbook').send({
      account_type: 'SAVINGS',
      page: 1,
      size: 6,
    }).set('Authorization', `Bearer ${token1}`);
    expect(response.status).toBe(200);
  });
});
