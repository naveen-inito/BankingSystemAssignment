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
const app = require('../../server.js');
const { createBankAccount } = require('../../services/accountServices.js');
const { getCardDetailsFromAccountNumber } = require('../../services/atmServices.js');
const { getUserAccountDetailsOfParticularType } = require('../../services/transactionServices.js');
const { signUpUser, signInUser } = require('../../services/userProfleServices.js');
const { getUserId } = require('../../utils/utils.js');

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
  beforeAll(async () => {
    request = supertest(app);
    const { pool } = require('../../db/connection.js');
    await pool.query('DELETE FROM transaction');
    await pool.query('DELETE FROM loan_account');
    await pool.query('DELETE FROM atm_card');
    await pool.query('DELETE FROM accounts');
    await pool.query('DELETE FROM users');
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
    result = await getUserAccountDetailsOfParticularType(getUserId('userone'), 'SAVINGS');
    useroneSavingsAccountDetails = result.rows[0];
    useroneCardDetails = await getCardDetailsFromAccountNumber(BigInt(useroneSavingsAccountDetails.accountNumber));
  });

  it('Test to deposit money in user\'s account', async () => {
    const response = await request.put('/api/account').send({
      amount: 5000,
      accountType: 'CURRENT',
    }).set('Authorization', `Bearer ${token1}`);
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Money added');
    token2 = response.body.token;
  });

  it('Test to transfer money from userone to usertwo account', async () => {
    const response = await request.put('/api/account').send({
      amount: -5000,
      receiverUsername: 'usertwo',
    }).set('Authorization', `Bearer ${token1}`);
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Money transferred');
    token2 = response.body.token;
  });

  it('Test to withdraw money from atm', async () => {
    const response = await request.put('/api/account').send({
      amount: -5000,
      cardNumber: useroneCardDetails.cardNumber,
      cvv: useroneCardDetails.cvv,
    }).set('Authorization', `Bearer ${token1}`);
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Money withdrawn from bank using ATM');
  });

  it('Test to withdraw money from bank', async () => {
    const response = await request.put('/api/account').send({
      amount: -5000,
      accountType: 'CURRENT',
    }).set('Authorization', `Bearer ${token1}`);
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Money withdrawn from bank');
  });

  it('Test to get account details', async () => {
    const response = await request.get('/api/account').send().set('Authorization', `Bearer ${token1}`);
    expect(response.status).toBe(200);
  });

  it('Test to get passbook of user', async () => {
    const response = await request.get('/api/passbook').send({
      accountType: 'SAVINGS',
    }).set('Authorization', `Bearer ${token1}`);
    expect(response.status).toBe(200);
  });
});
