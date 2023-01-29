/* eslint-disable no-undef */
const { validateSignUp } = require("../../validation/users");

describe('Testing validation', () => {
  const user1 = {
    id: 758234,
    username: 'naveen',
    name: 'user sixteenth',
    email: 'usereighteenth@test.com',
    password: 'usereighteenth',
    phoneNo: '+912222233333',
    dob: '01-01-1993',
    address: 'dummy address number 1',
  };

  it('Validate signup from JOI and db', async () => {
    const response = await validateSignUp(user1);
    expect(response.success).toBe(true);
    expect(response.message).toBe('valid details');
  });

  it('Validate signup from JOI and db', async () => {
    user1.username = '134';
    const response = await validateSignUp(user1);
    expect(response.success).toBe(false);
    expect(response.message).toBe('invalid details');
  });
});
