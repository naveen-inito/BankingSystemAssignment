/* eslint-disable max-len */
const { pool } = require('../db/connection');

const fetchUserDetails = async (id) => {
  const result = await pool.query(
    'select * from users where id = $1 LIMIT 1',
    [id],
  );
  return result.rows[0];
};

const fetchIdAndPasswordOfUser = async (id) => {
  const result = await pool.query(
    'select id, password from users where id = $1 LIMIT 1',
    [id],
  );
  return result.rows[0];
};

const insertIntoUsers = async (userId, username, name, email, hashedPassword, phoneNo, dob, address) => {
  const result = await pool.query(
    'insert into users(id, username, name, email, password, "phoneNo", dob, address) values($1,$2,$3,$4, $5, $6, $7, $8)',
    [userId, username, name, email, hashedPassword, phoneNo, dob, address],
  );
  return result;
};

module.exports = {
  fetchUserDetails, fetchIdAndPasswordOfUser, insertIntoUsers,
};
