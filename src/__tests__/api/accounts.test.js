/* eslint-disable global-require */
/* eslint-disable import/no-unresolved */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/extensions */
/* eslint-disable no-undef */
// import supertest from 'supertest';
// import app from '../../server.js';
const supertest = require('supertest');
const app = require('../../server.js');

const { pool } = require('../../db/connection.js');

describe('Testing Savings account creation', () => {
  let token;
  let request;
  let client;
  beforeAll(async () => {
    client = await pool.connect();
    await client.query('DELETE FROM transaction');
    await client.query('DELETE FROM loan_account');
    await client.query('DELETE FROM atm_card');
    await client.query('DELETE FROM accounts');
    await client.query('DELETE FROM users');
  });
  afterAll(async () => {
    (await client).release();
    // app.close();
  });

//   it('User should be created', async () => {
//     request = supertest(app);
//     const response = await request.get('/api/test').send();
//     console.log(response.body)
//     expect(response.body.success).toBe(true);
//     expect(1).toBe(1);
//   });

  it('User should be created', async () => {
    request = supertest(app);
    const response = await request.post('/api/signup').send({
      username: 'usereighteenth',
      name: 'user new',
      email: 'usereighteenth@test.com',
      password: 'usereighteenth',
      phone_no: '+912222233333',
      dob: '01-01-1993',
      address: 'dummy address number 1',
    });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('User created');
  });

  it('User should be logged in', async () => {
    request = supertest(app);
    const response = await request.post('/api/signin').send({
      username: 'usereighteenth',
      password: 'usereighteenth',
    });
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    token = response.body.token;
  });

  it('User\'s savings account should not be created (account type is invalid)', async () => {
    request = supertest(app);
    const response = await request.post('/api/account').send({
      amount: '100000',
      account_type: 'CRAVINGS',
    }).set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.status).toBe(false);
    expect(response.body.message).toBe('Invalid data entered');
  });

  it('User\'s savings account should not be created (amount is lesser)', async () => {
    request = supertest(app);
    const response = await request.post('/api/account').send({
      amount: '5000',
      account_type: 'SAVINGS',
    }).set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.status).toBe(false);
    expect(response.body.message).toBe('Minimum amount error');
  });

  it('User\'s savings account should be created', async () => {
    request = supertest(app);
    const response = await request.post('/api/account').send({
      amount: '100000',
      account_type: 'SAVINGS',
    }).set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.status).toBe(true);
    expect(response.body.message).toBe('Account Created');
  });

  it('User\'s savings account should not be created (account already exists)', async () => {
    request = supertest(app);
    const response = await request.post('/api/account').send({
      amount: '100000',
      account_type: 'SAVINGS',
    }).set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.status).toBe(false);
    expect(response.body.message).toBe('Account already exists');
  });
});

describe('Testing Current account creation', () => {
  let token;
  let request;
  //   let client = await pool.connect();
  let client;
  beforeAll(async () => {
    client = await pool.connect();
    await client.query('DELETE FROM transaction');
    await client.query('DELETE FROM loan_account');
    await client.query('DELETE FROM atm_card');
    await client.query('DELETE FROM accounts');
    await client.query('DELETE FROM users');
  });
  afterAll(async () => {
    (await client).release();
    // await pool.query('DELETE FROM transaction');
    // await pool.query('DELETE FROM loan_account');
    // await pool.query('DELETE FROM atm_card');
    // await pool.query('DELETE FROM accounts');
    // await pool.query('DELETE FROM users');
    // pool.end();
  });

  it('User should be created', async () => {
    request = supertest(app);
    const response = await request.post('/api/signup').send({
      username: 'usereighteenth',
      name: 'user new',
      email: 'usereighteenth@test.com',
      password: 'usereighteenth',
      phone_no: '+912222233333',
      dob: '01-01-1993',
      address: 'dummy address number 1',
    });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('User created');
  });

  it('User should be logged in', async () => {
    request = supertest(app);
    const response = await request.post('/api/signin').send({
      username: 'usereighteenth',
      password: 'usereighteenth',
    });
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    token = response.body.token;
  });

  it('User\'s current account should not be created (account type is invalid)', async () => {
    request = supertest(app);
    const response = await request.post('/api/account').send({
      amount: '100000',
      account_type: 'CRAVINGS',
    }).set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.status).toBe(false);
    expect(response.body.message).toBe('Invalid data entered');
  });

  it('User\'s current account should not be created (amount is lesser)', async () => {
    request = supertest(app);
    const response = await request.post('/api/account').send({
      amount: '99999',
      account_type: 'CURRENT',
    }).set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.status).toBe(false);
    expect(response.body.message).toBe('Minimum amount error');
  });

  it('User\'s current account should be created', async () => {
    request = supertest(app);
    const response = await request.post('/api/account').send({
      amount: '100000',
      account_type: 'CURRENT',
    }).set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.status).toBe(true);
    expect(response.body.message).toBe('Account Created');
  });

  it('User\'s current account should not be created (account already exists)', async () => {
    request = supertest(app);
    const response = await request.post('/api/account').send({
      amount: '100000',
      account_type: 'CURRENT',
    }).set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.status).toBe(false);
    expect(response.body.message).toBe('Account already exists');
  });
});

describe('Testing Loan account creation', () => {
  let token;
  let request;
  //   let client = await pool.connect();
  let client;
  beforeAll(async () => {
    client = await pool.connect();
    await client.query('DELETE FROM transaction');
    await client.query('DELETE FROM loan_account');
    await client.query('DELETE FROM atm_card');
    await client.query('DELETE FROM accounts');
    await client.query('DELETE FROM users');
  });
  afterAll(async () => {
    (await client).release();
    // await pool.query('DELETE FROM transaction');
    // await pool.query('DELETE FROM loan_account');
    // await pool.query('DELETE FROM atm_card');
    // await pool.query('DELETE FROM accounts');
    // await pool.query('DELETE FROM users');
    // pool.end();
  });

  it('User should be created', async () => {
    request = supertest(app);
    const response = await request.post('/api/signup').send({
      username: 'usereighteenth',
      name: 'user new',
      email: 'usereighteenth@test.com',
      password: 'usereighteenth',
      phone_no: '+912222233333',
      dob: '01-01-1993',
      address: 'dummy address number 1',
    });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('User created');
  });

  it('User should be logged in', async () => {
    request = supertest(app);
    const response = await request.post('/api/signin').send({
      username: 'usereighteenth',
      password: 'usereighteenth',
    });
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    token = response.body.token;
  });

  it('User\'s loan account should not be created (No other account exists)', async () => {
    request = supertest(app);
    const response = await request.post('/api/account').send({
      amount: '1000000',
      account_type: 'LOAN',
      loan_type: 'CAR',
      duration: '4',
    }).set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.status).toBe(false);
    expect(response.body.message).toBe('No other bank account exists');
  });

  it('User\'s current account should be created', async () => {
    request = supertest(app);
    const response = await request.post('/api/account').send({
      amount: '100000',
      account_type: 'CURRENT',
    }).set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.status).toBe(true);
    expect(response.body.message).toBe('Account Created');
  });

  it('User\'s loan account should not be created (total deposits error)', async () => {
    request = supertest(app);
    const response = await request.post('/api/account').send({
      amount: '500000',
      account_type: 'LOAN',
      loan_type: 'CAR',
      duration: '4',
    }).set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.status).toBe(false);
    expect(response.body.message).toBe('Loan amount should be lesser than 40% of total deposits');
  });

  it('User\'s savings account should be created', async () => {
    request = supertest(app);
    const response = await request.post('/api/account').send({
      amount: '1500000',
      account_type: 'SAVINGS',
    }).set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.status).toBe(true);
    expect(response.body.message).toBe('Account Created');
  });

  it('User\'s loan account should be created', async () => {
    request = supertest(app);
    const response = await request.post('/api/account').send({
      amount: '600000',
      account_type: 'LOAN',
      loan_type: 'CAR',
      duration: '4',
    }).set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.status).toBe(true);
    expect(response.body.message).toBe('Account Created');
  });
});
