const { Pool } = require('pg');
require('dotenv').config();

const databaseName = process.env.DATABASE_NAME;
// const databaseName = process.env.TEST_DATABASE_NAME;
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: databaseName,
  password: 'naveen',
  dialect: 'postgres',
  port: 5432,
});

module.exports = { pool };
