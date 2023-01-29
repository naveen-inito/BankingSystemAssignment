const { Pool } = require('pg');
require('dotenv').config();

const databaseName = process.env.DATABASE_NAME;
// const databaseName = process.env.TEST_DATABASE_NAME;
const dbpassword = process.env.DB_PASSWORD;
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: databaseName,
  password: dbpassword,
  dialect: 'postgres',
  port: 5432,
});

module.exports = { pool };
