/* eslint-disable max-len */
const {
  loanRepaymentService, depositMoneyService, withdrawFromBankService, withdrawFromAtmService, transferMoneyService,
} = require('../services/transactionServices');

const loanRepayment = async (req, res) => {
  try {
    const loanRepaymentResponse = await loanRepaymentService(req.body);
    return res.send(loanRepaymentResponse);
  } catch (error) {
    return res.status(400).send({ message: "Loan amount couldn't be payed" });
  }
};

const depositMoney = async (req, res) => {
  try {
    const depositMoneyResponse = await depositMoneyService(req.body);
    return res.send(depositMoneyResponse);
  } catch (error) {
    return res.status(400).send({
      message: 'Error while depositing the money',
    });
  }
};

const withdrawFromBank = async (req, res) => {
  try {
    const withdrawFromBankServiceResponse = await withdrawFromBankService(req.body);
    return res.send(withdrawFromBankServiceResponse);
  } catch (error) {
    console.error(error, '<-error');
    return res.status(400).send({
      message: 'Error while withdrawing money from bank',
    });
  }
};

const withdrawFromAtm = async (req, res) => {
  try {
    req.body.accountType = 'SAVINGS';
    const withdrawFromAtmServiceResponse = await withdrawFromAtmService(req.body);
    return res.send(withdrawFromAtmServiceResponse);
  } catch (error) {
    console.error(error, '<-error');
    return res.status(400).send({
      message: 'Error while withdrawing money from ATM',
    });
  }
};

const transferMoney = async (req, res) => {
  try {
    const transferMoneyServiceResponse = await transferMoneyService(req.body);
    return res.send(transferMoneyServiceResponse);
  } catch (error) {
    console.error(error, '<-error');
    return res.status(400).send({
      message: 'Error while transfering money',
    });
  }
};

module.exports = {
  loanRepayment,
  depositMoney,
  withdrawFromBank,
  withdrawFromAtm,
  transferMoney,
};
