const { createBankAccount } = require('../services/accountServices');

const createAccount = async (req, res) => {
  try {
    const createBankAccountResponse = await createBankAccount(req.body);
    return res.send(createBankAccountResponse);
  } catch (error) {
    return res.status(400).send({
      message: 'Error while creating the account',
    });
  }
};

module.exports = {
  createAccount,
};
