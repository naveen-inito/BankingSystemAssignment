/* eslint-disable max-len */
/* eslint-disable global-require */
/* eslint-disable import/no-unresolved */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/extensions */
/* eslint-disable no-undef */

const {
  registerUser, signUpUser, generateAuthToken, signInUser, validateUser, getUserDetails,
} = require('../../services/userProfleServices.js');
const { userExists } = require('../../services/userServices.js');
const { getUserId } = require('../../utils/utils.js');
// Link to your server file
// const request = supertest(app);
// const { pool } = require('../../db/connection.js');

describe('User Profile services testing', () => {
  const { pool } = require('../../db/connection.js');
  beforeAll(async () => {
    await pool.query('DELETE FROM transaction');
    await pool.query('DELETE FROM loan_account');
    await pool.query('DELETE FROM atm_card');
    await pool.query('DELETE FROM accounts');
    await pool.query('DELETE FROM users');
  });

  afterAll(async () => {
    pool.end();
  });

  const user1 = {
    username: 'userone123',
    name: 'user one',
    email: 'userone',
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

  it('User should not be registered (invalid username & email)', async () => {
    const response = await signUpUser(user1);
    expect(response.success).toBe(false);
    expect(response.message).toBe('invalid details');
  });

  it('User should be registered', async () => {
    user1.username = 'userone';
    user1.email = 'userone@gmail.com';
    const response = await signUpUser(user1);
    expect(response.success).toBe(true);
    expect(response.message).toBe('User created');
  });

  it('User should not be signed in (invalid password)', async () => {
    const response = await signInUser({ username: 'userone', password: 'onety' });
    expect(response.success).toBe(false);
    expect(response.message).toBe('username/password does not match.');
  });

  it('User should be signed in', async () => {
    const response = await signInUser({ username: 'userone', password: 'userone' });
    expect(response.success).toBe(true);
    userToken1 = response.token;
  });

  it('Auth token should be generated', async () => {
    const response = await generateAuthToken({ id: 34214 });
    expect(response).toBeDefined();
  });

  it('should not validate (wrong id and password passed)', async () => {
    userId1 = getUserId(user1.username);
    const response = await validateUser(1234, '1234'); // (id, password) passed as parameter
    expect(response.id).toBeUndefined();
    expect(response.password).toBeUndefined();
  });

  it('should validate', async () => {
    userId1 = getUserId(user1.username);
    const response = await validateUser(userId1, user1.password); // (id, password) passed as parameter
    expect(response.id).toBeDefined();
    expect(response.password).toBeDefined();
  });

  it('should get user details', async () => {
    const response = await getUserDetails(userId1); // id is passed
    expect(response.address).toBeDefined();
  });

  it('should register user into the database', async () => {
    const response = await registerUser(user2);
    expect(response).toBe(true);
  });

  it('should return false (invalid id passed)', async () => {
    const response = await userExists({ id: 32145 });
    expect(response).toBe(false);
  });

  it('should return true', async () => {
    const response = await userExists({ id: userId1 });
    expect(response).toBe(true);
  });
});
