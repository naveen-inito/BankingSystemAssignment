const { createBankAccount } = require('../services/accountServices');

const createAccount = async (req, res) => {
  try {
    const { id, amount, duration } = req.body;
    const accountType = req.body.account_type;
    const loanType = req.body.loan_type;
    const createBankAccountResponse = await createBankAccount({
      id, amount, accountType, loanType, duration,
    });
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
