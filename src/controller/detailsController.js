const { getAllAccountDetails, getUserPassbook } = require('../services/accountServices');

const getAccountDetails = async (req, res) => {
  try {
    const { id } = req.body;
    const getAllAccountDetailsResponse = await getAllAccountDetails(id);
    return res.send(getAllAccountDetailsResponse);
  } catch (error) {
    return res.status(400).send({
      message: 'Error while fetching account details',
    });
  }
};

const getPassbook = async (req, res) => {
  try {
    const { id, accountType } = req.body;
    const userPassbookResponse = await getUserPassbook(id, accountType);
    return res.send(userPassbookResponse);
  } catch (error) {
    return res.status(400).send({
      message: 'Error while fetching account details',
    });
  }
};

module.exports = {
  getAccountDetails,
  getPassbook,
};
