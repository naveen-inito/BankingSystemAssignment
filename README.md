# Banking System Assignment


## Setup Steps

1. On terminal, in the given folder type command, "**npm install**" to install all the required packages.
2. Then, type command "**npm start**" to start the backend server.



## Database Diagram link

[Link](https://drive.google.com/file/d/1ROqd12j08kMC93AeJysqNIdRfQVToLDU/view?usp=sharing)



## API

1. **POST** /api/signup

Registers the user
```json
{
    "username": "userfourth",
    "name": "fn ln",
    "email": "userfourth@test.com",
    "password": "userfourth",
    "phone_no": "+912222233333",
    "dob": "01-01-2003",
    "address": "dummy address number 1"
}
```

2. **POST** /api/signin

User can login
```json
{
    "username": "userfourth",
    "password": "userfourth"
}
```

3. **POST** /api/account

User's bank account is created (savings/current/loan)
(Also pass jwt token in the header)

```json
{
    "accountType": "CURRENT",
    "amount": "200000"
}
```
```json
{
    "accountType": "LOAN",
    "loanType": "CAR",
    "duration": "4",
    "amount": "600000"
}
```
```json
{
    "accountType": "SAVINGS",
    "amount": "60000"
}
```


4. **PUT** /api/account

Deposit money 
(Also pass jwt token in the header)
```json
{
    "accountType": "CURRENT",
    "amount": "2000000"
}
```

5. **PUT** /api/account

Withdraw from atm
(Also pass jwt token in the header)

```json
{
    "amount": "-500",
    "cardNumber": "412976663691526",
    "cvv": "911"
}
```

6. **PUT** /api/account

Withdraw from bank
(Also pass jwt token in the header)

```json
{
    "amount": "-52000",
    "accountType": "SAVINGS"
}
```

7. **PUT** /api/account

Transfer money
(Also pass jwt token in the header)

```json
{
    "receiverUsername": "userfirst",
    "amount": "-20000"
}
```


8. **PUT** /api/account

Loan repayment
(Also pass jwt token in the header)

```json
{
    "amount": "50000",
    "accountType": "LOAN"
}
```

9. **GET** /api/account

Gets user's all bank account details
(Also pass jwt token in the header)


10. **GET** /api/passbook

Gets user's all the transactions of a bank account
(Also pass jwt token in the header)

```json
{
    "accountType": "SAVINGS",
    "page": 1,
    "size" : 10
}
```




