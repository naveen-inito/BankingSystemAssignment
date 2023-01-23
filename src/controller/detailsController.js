const { getAllAccountDetails, getUserPassbook } = require('../services/accountServices');

const getAccountDetails = async (req, res) => {
  try {
    const { id } = req.body;
    const getAllAccountDetailsResponse = await getAllAccountDetails(id);
    return res.send(getAllAccountDetailsResponse);
  } catch (error) {
    return res.status(400).send({ message: 'Error while fetching account details' });
  }
};

const getPassbook = async (req, res) => {
  try {
    if (!req.body.page) {
      req.body.page = 1;
    }
    if (!req.body.size) {
      req.body.size = 50;
    }
    const {
      id, page, size,
    } = req.body;
    const accountType = req.body.account_type;
    const userPassbookResponse = await getUserPassbook(id, accountType, page, size);
    return res.send(userPassbookResponse);
  } catch (error) {
    return res.status(400).send({ message: 'Error while fetching account details' });
  }
};

module.exports = {
  getAccountDetails,
  getPassbook,
};
