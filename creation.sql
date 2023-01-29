
-- Create the database
-- CREATE DATABASE banksystem_dummy owner postgres;



-- Create users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name VARCHAR(32) NOT NULL,
    username VARCHAR(32) NOT NULL,
    email VARCHAR(32) NOT NULL,
    password VARCHAR(255) NOT NULL,
    dob Date NOT NULL,
    "phoneNo" VARCHAR(15) NOT NULL,
    address VARCHAR(255) NOT NULL,
    unique(email),
    unique(username)
);


-- Create accounts query
CREATE TABLE accounts (
    "accountNumber" BIGINT PRIMARY KEY,
    "accountType" VARCHAR(10) NOT NULL,
    "userId" INT NOT NULL,
    "createdAt" DATE NOT NULL,
    balance INTEGER,
    FOREIGN KEY ("userId") REFERENCES users(id),
    unique("accountNumber")
);


-- Create loan_account table query
CREATE TABLE loan_account (
    "accountNumber" BIGINT PRIMARY KEY,
    "loanType" VARCHAR(20) NOT NULL,
    interest INT NOT NULL,
    amount INT NOT NULL,
    duration INT NOT NULL,
    status VARCHAR(20) NOT NULL,
    FOREIGN KEY ("accountNumber") REFERENCES accounts("accountNumber")
);


-- Create atm_card table query
CREATE TABLE atm_card (
    "cardNumber" BIGINT PRIMARY KEY,
    "accountNumber" BIGINT NOT NULL,
    "expiryDate" DATE NOT NULL,
    cvv INT NOT NULL,
    FOREIGN KEY ("accountNumber") REFERENCES accounts("accountNumber")
);


-- Create atm_card table query
CREATE TABLE transaction (
    "transactionNumber" BIGINT PRIMARY KEY,
    "transactionType" VARCHAR(30) NOT NULL,
    "accountNo" BIGINT NOT NULL,
    amount INT,
    "amountBeforeTransaction" INT NOT NULL,
    "dateOfTransaction" timestamp DEFAULT CURRENT_DATE,
    FOREIGN KEY ("accountNo") REFERENCES accounts("accountNumber")
);

