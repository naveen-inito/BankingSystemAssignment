/* eslint-disable global-require */
/* eslint-disable import/no-unresolved */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/extensions */
/* eslint-disable no-undef */
// import supertest from 'supertest';
// import app from '../../server.js';

const supertest = require('supertest');
const app = require('../../server.js');
// Link to your server file
// const request = supertest(app);
// const { pool } = require('../../db/connection.js');

describe('Testing signup (creating same user two times)', () => {
  let request;
  beforeAll(async () => {
    request = supertest(app);
    const { pool } = require('../../db/connection.js');
    await pool.query('DELETE FROM transaction');
    await pool.query('DELETE FROM loan_account');
    await pool.query('DELETE FROM atm_card');
    await pool.query('DELETE FROM accounts');
    await pool.query('DELETE FROM users');
  });

  it('User should be created', async () => {
    const response = await request.post('/api/signup').send({
      username: 'usereighteenth',
      name: 'user sixteenth',
      email: 'usereighteenth@test.com',
      password: 'usereighteenth',
      phoneNo: '+912222233333',
      dob: '01-01-1993',
      address: 'dummy address number 1',
    });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('User created');
  });

  it('User should not be created', async () => {
    const response = await request.post('/api/signup').send({
      username: 'usereighteenth',
      name: 'user sixteenth',
      email: 'usereighteenth@test.com',
      password: 'usereighteenth',
      phoneNo: '+912222233333',
      dob: '01-01-1993',
      address: 'dummy address number 1',
    });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('User could not be created');
  });
});

describe('Testing signup (passing invalid fields)', () => {
  let request;
  beforeAll(async () => {
    request = supertest(app);
    const { pool } = require('../../db/connection.js');
    await pool.query('DELETE FROM transaction');
    await pool.query('DELETE FROM loan_account');
    await pool.query('DELETE FROM atm_card');
    await pool.query('DELETE FROM accounts');
    await pool.query('DELETE FROM users');
  });

  it('User should not be created', async () => {
    const response = await request.post('/api/signup').send({
      username: 'user1234',
      name: 'user sixteenth',
      email: 'usereighteenth@test.com',
      password: 'usereighteenth',
      phoneNo: '+912222233333',
      dob: '01-01-1993',
      address: 'dummy address number 1',
    });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('invalid details');
  });

  it('User should not be created', async () => {
    const response = await request.post('/api/signup').send({
      username: 'usereighteenth',
      name: 'user sixteenth',
      email: 'usereighteenth',
      password: 'usereighteenth',
      phoneNo: '+912222233333',
      dob: '01-01-1993',
      address: 'dummy address number 1',
    });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('invalid details');
  });
  it('User should not be created', async () => {
    const response = await request.post('/api/signup').send({
      username: 'usereighteenth',
      name: 'user sixteenth',
      email: 'usereighteenth',
      password: 'usereighteenth',
      phoneNo: '233333',
      dob: '01-01-1993',
      address: 'dummy address number 1',
    });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('invalid details');
  });
  it('User should not be created', async () => {
    const response = await request.post('/api/signup').send({
      username: 'usereighteenth',
      name: 'user sixteenth',
      email: 'usereighteenth',
      password: 'usereighteenth',
      phoneNo: '+912222233333',
      dob: '+912222233333',
      address: 'dummy address number 1',
    });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('invalid details');
  });
});

describe('Testing login after signup', () => {
  let token;
  let request;
  beforeAll(async () => {
    request = supertest(app);
    const { pool } = require('../../db/connection.js');
    await pool.query('DELETE FROM transaction');
    await pool.query('DELETE FROM loan_account');
    await pool.query('DELETE FROM atm_card');
    await pool.query('DELETE FROM accounts');
    await pool.query('DELETE FROM users');
  });

  it('User should be created', async () => {
    const response = await request.post('/api/signup').send({
      username: 'usereighteenth',
      name: 'user new',
      email: 'usereighteenth@test.com',
      password: 'usereighteenth',
      phoneNo: '+912222233333',
      dob: '01-01-1993',
      address: 'dummy address number 1',
    });
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('User created');
  });

  it('User should be logged in', async () => {
    const response = await request.post('/api/signin').send({
      username: 'usereighteenth',
      password: 'usereighteenth',
    });
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    token = response.body.token;
  });

  it('User should not be logged in', async () => {
    const response = await request.post('/api/signin').send({
      username: 'usereighteenth',
      password: 'password',
    });
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('username/password does not match.');
    // token = response.body.token;
  });
});
