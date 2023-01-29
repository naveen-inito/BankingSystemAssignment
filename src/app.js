/* eslint-disable import/extensions */
/* eslint-disable import/no-unresolved */
const express = require('express');

const app = express();

app.use(express.json());

const { createAccount } = require('./controller/accountController');
const { signUp, signIn } = require('./controller/userProfileController');
const { getAccountDetails, getPassbook } = require('./controller/detailsController');
const { handleAccountUpdates } = require('./controller/transactionController');

const authMiddleware = require('./middleware/auth');

// ----- API's -----

// user signup and login api's
app.post('/api/signup', signUp);
app.post('/api/signin', signIn);

// create account api's
app.post('/api/account', authMiddleware, createAccount);

// show details api's
app.get('/api/account', authMiddleware, getAccountDetails);
app.get('/api/passbook', authMiddleware, getPassbook);

// transaction api
app.put('/api/account', authMiddleware, handleAccountUpdates);

module.exports = app;
