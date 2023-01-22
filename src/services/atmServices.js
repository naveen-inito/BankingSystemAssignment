const { makeid, formatDate } = require('../utils/utils');
const { insertIntoATM, getCardDetails, fetchCardDetailsFromAccountNumber } = require('../models/atmModel');

const issueAtmCard = async (accountNumber) => {
  const cardNumber = makeid(16, '0123456789');
  const cvv = makeid(3, '0123456789');

  const d = new Date();
  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();
  const expiryDateResp = new Date(year + 6, month, day);
  const expiryDate = formatDate(expiryDateResp);

  return {
    cardNumber, expiryDate, cvv,
  };
};

const getCardDetailsFromAccountNumber = async (accountNumber) => {
  const result = await fetchCardDetailsFromAccountNumber(accountNumber);
  return result;
};

const verifyCardDetails = async (accountNumber, cardNumber, cvv) => {
  const result = await getCardDetails(cardNumber);
  if (!result) {
    return false;
  }
  if ((result.accountNumber === accountNumber) && (result.cvv === parseInt(cvv, 10))) {
    return true;
  }
  return false;
};

module.exports = {
  issueAtmCard, verifyCardDetails, getCardDetailsFromAccountNumber,
};
