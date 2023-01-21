/* eslint-disable import/extensions */
/* eslint-disable global-require */
/* eslint-disable no-undef */
const {
  createBankAccount, getAllAccountDetails,
} = require('../../services/accountServices.js');
const { getCardDetailsFromAccountNumber, verifyCardDetails } = require('../../services/atmServices.js');
const { signUpUser } = require('../../services/userProfleServices.js');
const { getUserId} = require('../../utils/utils.js');

describe('Atm services testing', () => {
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
  let card1; let expiry1;
  let cvv1;
  let accNo1;
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
    await createBankAccount({ id: userId1, accountType: 'SAVINGS', amount: '1000000' });
    const response1 = await getAllAccountDetails(userId1);
    accNo1 = response1.Savings.accountNumber;
  });

  afterAll(async () => {
    pool.end();
  });

  it('should get card details from accont number', async () => {
    const response = await getCardDetailsFromAccountNumber(accNo1);
    expect(response.cardNumber).toBeDefined();
    expect(response.expiryDate).toBeDefined();
    expect(response.cvv).toBeDefined();
    card1 = response.cardNumber;
    expiry1 = response.expiryDate;
    cvv1 = response.cvv;
  });

  it('should return true', async () => {
    const response = await verifyCardDetails(accNo1, card1, cvv1);
    expect(response).toBe(true);
  });
});
