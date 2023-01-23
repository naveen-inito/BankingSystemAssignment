/* eslint-disable max-len */
/* eslint-disable import/extensions */
/* eslint-disable global-require */
/* eslint-disable no-undef */

const {
  createMapper, generateTransactionNumber, generateAccountNo, getLastDayOfMonthYear, calculateAge, getNumberOfDays,
} = require('../../utils/utils.js');

describe('Testing utils', () => {
  it('checking create mapper', async () => {
    const response = createMapper();
    expect(response[0]).toBe(1);
    expect(response[1]).toBe(3);
    expect(response[2]).toBe(8);
    expect(response[3]).toBe(19);
  });

  it('checking create mapper', async () => {
    const response = createMapper();
    expect(response[0]).toBe(1);
    expect(response[1]).toBe(3);
    expect(response[2]).toBe(8);
    expect(response[3]).toBe(19);
  });

  it('generating transaction number', async () => {
    const response = generateTransactionNumber();
    expect(response).toBeGreaterThan(1000000000000n);
  });

  it('generating account number', async () => {
    const response = generateAccountNo(10);
    expect(response).toBeDefined();
  });

  it('get last day of a month', async () => {
    const response1 = await getLastDayOfMonthYear(2023, 0);
    const response2 = await getLastDayOfMonthYear(2023, 1);
    expect(response1).toBe(31);
    expect(response2).toBe(28);
  });

  it('calculate age', async () => {
    const response = await calculateAge(new Date('2001-04-11'));
    expect(response).toBe(21);
  });

  // it('get date difference', async () => {
  //   const response = await getNumberOfDays('2023-01-22', '2023-01-23');
  //   expect(response).toBe(2);
  // });
});
