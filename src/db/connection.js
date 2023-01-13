const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'banksystem',
    password: 'naveen',
    dialect: 'postgres',
    port: 5432
});

module.exports = { pool };