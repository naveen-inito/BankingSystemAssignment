const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'banksystem',
    password: 'naveen',
    dialect: 'postgres',
    port: 5432
});
// const pool = new Pool({
//   host: 'localhost',
//   user: 'postgres',
//   password: 'naveen',
//   port: 5432,
//   database: 'banksystem'
// });

module.exports = { pool };