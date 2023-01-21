const { fetchUserDetails } = require("../models/userModel");

const userExists = async (id) => {
  const result = await fetchUserDetails(id);
  if (result) {
    return true;
  }
  return false;
};

module.exports = {
  userExists,
};
