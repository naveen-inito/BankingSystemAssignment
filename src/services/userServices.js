const { getCountById } = require('../models/userModel');

const userExists = async ({ id }) => {
  const result = await getCountById(id);
  const { count } = result.rows[0];
  if (count > 0) {
    return true;
  }
  return false;
};

module.exports = {
  userExists,
};
