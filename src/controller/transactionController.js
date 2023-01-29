/* eslint-disable max-len */
const { handleTransactions } = require('../services/transactionServices');

const handleAccountUpdates = async (req, res) => {
  try {
    const { id, amount } = req.body;
    const accountType = req.body.account_type;
    const cardNumber = req.body.card_number;
    const { cvv } = req.body;
    const receiverUsername = req.body.receiver_username;
    const handleTransactionsResponse = await handleTransactions({
      id, amount, accountType, cardNumber, cvv, receiverUsername,
    });
    return res.send(handleTransactionsResponse);
  } catch (error) {
    return res.status(400).send({ message: 'Transaction could not be done' });
  }
};

module.exports = {
  handleAccountUpdates,
};
