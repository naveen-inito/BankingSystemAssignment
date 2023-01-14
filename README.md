# Banking System Assignment


## Setup Steps

1. On terminal, in the given folder type command, "**npm install**" to install all the required packages.
2. Then, type command "**npm start**" to start the backend server.



## Database Diagram link

[Link](https://drive.google.com/file/d/1ROqd12j08kMC93AeJysqNIdRfQVToLDU/view?usp=sharing)



## API

1. **POST** /create_account

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

2. **POST** /log_in

```json
{
    "username": "userfourth",
    "password": "userfourth"
}
```

3. **POST** /create_account

(Also pass jwt token in the header)

```json
{
    "username": "userfourth",
    "account_type": "CURRENT",
    "amount": "200000"
}
```
```json
{
    "username": "userfourth",
    "account_type": "LOAN",
    "loan_type": "PERSONAL",
    "duration": "4",
    "amount": "600000"
}
```
```json
{
    "username": "userfourth",
    "account_type": "SAVINGS",
    "amount": "60000"
}
```


4. **POST** /deposit_money

(Also pass jwt token in the header)

```json
{
    "username": "userfourth",
    "account_type": "CURRENT",
    "amount": "20000"
}
```

5. **POST** /withdraw_from_atm

(Also pass jwt token in the header)

```json
{
    "username": "userfourth",
    "amount": "500",
    "account_type": "SAVINGS",
    "card_number": "5109829529368761",
    "cvv": "455"
}
```

6. **POST** /withdraw_from_bank

(Also pass jwt token in the header)

```json
{
    "username": "userfourth",
    "amount": "52000",
    "account_type": "CURRENT"
}
```

7. **POST** /transfer_money

(Also pass jwt token in the header)

```json
{
    "username": "userfourth",
    "receiver_username": "userfirst",
    "amount": "20000"
}
```


8. **POST** /loan_repayment

(Also pass jwt token in the header)

```json
{
    "username": "userfourth",
    "amount": "50000"
}
```

9. **GET** /get_account_details

(Also pass jwt token in the header)

```json
{
    "username": "userfourth"
}
```

10. **GET** /get_passbook

(Also pass jwt token in the header)

```json
{
    "username": "userfourth",
    "account_type": "CURRENT"
}
```




