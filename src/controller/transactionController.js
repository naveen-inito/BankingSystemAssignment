/* eslint-disable max-len */
const { handleTransactions } = require('../services/transactionServices');

const handleAccountUpdates = async (req, res) => {
  try {
    const handleTransactionsResponse = await handleTransactions(req.body);
    return res.send(handleTransactionsResponse);
  } catch (error) {
    console.log(error);
    return res.status(400).send({ message: 'Transaction could not be done' });
  }
};

module.exports = {
  handleAccountUpdates,
};
