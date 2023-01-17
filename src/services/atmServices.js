const { makeid, formatDate } = require('../utils/utils');
const { insertIntoATM, getCardDetails } = require('../models/atmModel');

const issueAtmCard = async (accountNumber) => {
  const cardNumber = makeid(16, '0123456789');
  const cvv = makeid(3, '0123456789');

  const d = new Date();
  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();
  const expiryDateResp = new Date(year + 6, month, day);
  const expiryDate = formatDate(expiryDateResp);

  const result = await insertIntoATM(cardNumber, accountNumber, expiryDate, cvv);
  return result;
};

const verifyCardDetails = async (accountNumber, cardNumber, cvv) => {
  const result = await getCardDetails(cardNumber);
  if (!result) {
      return false;
    }
    console.log(result, ", ", accountNumber, ", ", cvv, ", ", result.accountNumber, ", " , (result.accountNumber === accountNumber), ", ", (result.cvv === parseInt(cvv, 10)));
    if ((result.accountNumber === accountNumber) && (parseInt(result.cvv, 10) === parseInt(cvv, 10))) {
      console.log(result, ", ", accountNumber, ", ", cvv);
    return true;
  }
  return false;
};

module.exports = {
  issueAtmCard, verifyCardDetails,
};
