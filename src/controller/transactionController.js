const { getLoanAmountRepayed, updateLoanStatus, verifyCardDetails } = require("../services/accountServices");
const { getUserAccountDetailsOfLoanAccount } = require("../utils/common");
const { getUserId, getUserDetails } = require("../utils/utils");


const loan_repayment = async (req, res) => {
    try {
        // deposit money facility is only applicable in "CURRENT" account
        // i.e., user deposits money to his own account

        const { username, amount} = req.body;
        const user_id = getUserId(username);

        // const accountDetails = await getUserAccountDetailsOfParticularType(user_id, "LOAN");
        const accountDetails = await getUserAccountDetailsOfLoanAccount(user_id);
        const account = accountDetails.rows[0];

        // If receiver does not have "LOAN" account..
        if(!account){
            res.status(400).send({
                message: "User account does not exist"
            })
        }

        // Checking whether the repay amount is not excedding 10% of total loan amount
        const totalLoanAmount = account.amount;
        if(amount>0.1*totalLoanAmount){
            res.status(400).send({
                message: "Loan repayment amount excedded"
            })
            return;
        }

        // Checking whether the repay amount is not excedding the remaining loan amount
        
        var loanAmountRepayed = getLoanAmountRepayed(account.account_number); // It will be negative
        if(loanAmountRepayed==null)
            loanAmountRepayed = 0;

        if(amount > parseInt(parseInt(totalLoanAmount) + parseInt(loanAmountRepayed))){
            res.status(400).send({
                message: "Loan repayment amount excedded"
            })
            return;
        }

        // Now, finally deposit money in Receiver's "CURRENT" account
        const subtractMoneyResponse = await subtractMoney(account.account_number, amount, 'LOAN');
        console.log(subtractMoneyResponse)

        // Now, we also need to keep this transaction in "transaction" table
        const transaction_number = generateTransactionNumber();

        const currentDate = Date(Date.now()).toString();
        const formattedDate = formatDate(currentDate);

        const result = await addTransaction(transaction_number, "LOAN_REPAYMENT", account.account_number, null, amount, formattedDate, parseInt(parseInt(totalLoanAmount) + parseInt(loanAmountRepayed)), null);

        if (result.rowCount==0) {
            // Query has not run properly
            res.status(400).send({
                message: "Loan amount couldn't be payed"
            });
            return;
        }

        if(amount == parseInt(parseInt(totalLoanAmount) + parseInt(loanAmountRepayed))){
            // Then the loan is completed
            // We need to set its status as 'inactive'
            const update_status = updateLoanStatus(account.account_number, 'inactive')
        }

        res.status(200).send({
            message: "Loan amount successfully payed"
        });
        
    } catch (error) {
        res.status(400).send({
            message: "Loan amount couldn't be payed"
        });
        console.error(error, "<-error");
    }
};

const deposit_money = async (req, res) => {
    try {
        // deposit money facility is only applicable in "CURRENT" account
        // i.e., user deposits money to his own account

        const { username, account_type, amount} = req.body;
        const user_id = getUserId(username);

        const receiver_username = username;

        // receiver must have the "CURRENT" account
        const receiverUserId = getUserId(receiver_username);
        const receiverDetails = await getUserDetails(receiverUserId);
        
        const accountDetails = await getUserAccountDetailsOfParticularType(receiverUserId, account_type);
        const account = accountDetails.rows[0];

        // If receiver does not have "CURRENT" account..
        if(!account){
            res.status(400).send({
                message: "Receiver's accounts does not exist"
            })
        }

        var finalAmount = amount;

        // If account is "CURRENT", then we need to put transaction charge of 0.5% of amount
        if(account_type=='CURRENT'){
            const transaction_charge = Math.min((amount/100) * 0.5, 500);
            const subtractMoneyResponse = await subtractMoney(account.account_number, transaction_charge, account_type);
            finalAmount -= transaction_charge;
        }

        const amountBeforeTransaction = account.balance;

        // Now, finally deposit money in Receiver's "CURRENT" account
        const addMoneyResponse = await addMoney(account.account_number, finalAmount, "CURRENT");

        if(addMoneyResponse.rowCount==0){
            res.status(400).send({
                message: "Money could not be added"
            });
        }

        // Now, we also need to keep this transaction in "transaction" table
        const transaction_number = generateTransactionNumber();

        const currentDate = Date(Date.now()).toString();
        const formattedDate = formatDate(currentDate);

        const result = await addTransaction(transaction_number, "DEPOSIT", null, account.account_number, finalAmount, formattedDate, null, amountBeforeTransaction);

        if (result.rowCount==0) {
            // Query has not run properly
            res.status(400).send({
                message: "Transaction could not be done"
            });
            return;
        }

        res.status(200).send({
            message: "Money added"
        });
        
    } catch (error) {
        res.status(400).send({
            signup_error: 'Error while depositing the money'
        });
        console.error(error, "<-error");
    }
};

const withdraw_from_bank = async (req, res) => {
    try {
        const {username, amount, account_type} = req.body;

        const user_id = getUserId(username)
        const accountDetails = await getUserAccountDetailsOfParticularType(user_id, account_type);
        const account = accountDetails.rows[0];

        const currentDate = Date(Date.now()).toString();
        const formattedDate = formatDate(currentDate);

        // If receiver does not have "CURRENT" account..
        if(!account){
            res.status(400).send({
                message: "Account does not exist"
            })
            return;
        }
        
        if(account.balance<amount){
            res.status(400).send({
                message: "Amount excedded"
            })
            return;
        }

        // Checking whether total withdraw amount for current day does not exceed by 50000
        const currentDayWithdrawalAmountResult = await getCurrentDayWithdrawalAmount(account.account_number, formattedDate);
        const currentDayWithdrawalAmount = currentDayWithdrawalAmountResult.rows[0].sum;
        const total_amount = parseInt(currentDayWithdrawalAmount) + parseInt(amount);
        if(total_amount > 50000){
            res.status(200).send({
                message: "Money withdrawal amount limit excedded",
            })
            return;
        }

        const amount_before_transaction = account.balance;

        // Now, finally deposit money in Receiver's "CURRENT" account
        const subtractMoneyResponse = await subtractMoney(account.account_number, amount, account_type);
        console.log(subtractMoneyResponse);
        console.log(JSON.stringify(subtractMoneyResponse) + "<< response of add money");

        if(subtractMoneyResponse.rowCount==0){
            res.status(400).send({
                message: "Money could not be added"
            });
            return;
        }

        // Now, we also need to keep this transaction in "transaction" table
        const transaction_number = generateTransactionNumber();

        const result = await addTransaction(transaction_number, "WITHDRAW_FROM_BANK", account.account_number, null, amount, formattedDate, amount_before_transaction, null);

        if (result.rowCount==0) {
            // Query has not run properly
            res.status(400).send({
                message: "Transaction could not be done"
            });
            return;
        }

        res.status(200).send({
            message: "Money withdrawn from bank"
        });
        
    } catch (error) {
        res.status(400).send({
            message: 'Error while withdrawing the money'
        });
        console.error(error, "<-error");
    }
};

const withdraw_from_atm = async (req, res) => {
    try {
        const { username, amount, account_type, card_number, cvv} = req.body;

        const user_id = getUserId(username);
        const accountDetails = await getUserAccountDetailsOfParticularType(user_id, account_type);
        const account = accountDetails.rows[0];

        // If receiver does not have "CURRENT" account..
        if(!account){
            res.status(400).send({
                message: "Account does not exist"
            })
            return;
        }

        const cardVerified = await verifyCardDetails(account.account_number, card_number, cvv);
        if(!cardVerified){
            res.status(400).send({
                message: "Invalid Details"
            })
            return;
        }
        
        if(account.balance<amount){
            res.status(400).send({
                message: "Amount excedded"
            })
            return;
        }

        // const currentDate = Date(Date.now());
        const currentDate = Date(Date.now());
        const formattedDate = formatDate(currentDate);

        // Checking whether total withdraw amount for current day does not exceed by 50000
        const currentDayWithdrawalAmountResult = await getCurrentDayWithdrawalAmount(account.account_number, formattedDate);
        const currentDayWithdrawalAmount = currentDayWithdrawalAmountResult.rows[0].sum;

        const total_amount = parseInt(-1 * currentDayWithdrawalAmount) + parseInt(amount);

        if(total_amount > 50000){
            res.status(200).send({
                message: "Money withdrawal amount limit excedded",
            })
            return;
        }

        // Checking whether total monthly withdraw by atm does not exceed by 5 for a month
        const currentMonthWithdrawCount = await getCurrentMonthAtmWithdrawCount(account.account_number, formattedDate);
        
        var amount_before_transaction = account.balance;
        if(currentMonthWithdrawCount>=5){
            // Now, charge 500 for each withdraw
            const penaltyForLimit = await subtractMoney(account.account_number, 500, account_type);
            if(penaltyForLimit.rowCount==0){
                res.status(400).send({
                    message: "Could not complete the transaction"
                });
                return;
            }
            amount_before_transaction -= 500;
        }

        const subtractMoneyResponse = await subtractMoney(account.account_number, amount, account_type);

        if(subtractMoneyResponse.rowCount==0){
            res.status(400).send({
                message: "Money could not be withdrawn from ATM"
            });
            return;
        }

        // Now, we also need to keep this transaction in "transaction" table
        const transaction_number = generateTransactionNumber();

        const result = await addTransaction(transaction_number, "WITHDRAW_FROM_ATM", account.account_number, null, amount, formattedDate, amount_before_transaction, null);

        if (result.rowCount==0) {
            // Query has not run properly
            res.status(400).send({
                message: "Transaction could not be done"
            });
            return;
        }

        res.status(200).send({
            message: "Money withdrawn from bank using ATM"
        });
        
    } catch (error) {
        res.status(400).send({
            message: 'Error while withdrawing the money'
        });
        console.error(error, "<-error");
    }
};

const transfer_money = async (req, res) => {
    try {
        const {username, receiver_username, amount} = req.body;

        const senderUserId = getUserId(username);
        const senderDetails = await getUserDetails(senderUserId);
        const senderAccountDetails = await getUserAccountDetailsOfParticularType(senderUserId, "CURRENT");
        const senderAccount = senderAccountDetails.rows[0];

        // receiver must have the "CURRENT" account
        const receiverUserId = getUserId(receiver_username);
        const receiverDetails = await getUserDetails(receiverUserId);
        const receiverAccountDetails = await getUserAccountDetailsOfParticularType(receiverUserId, "CURRENT");
        const receiverAccount = receiverAccountDetails.rows[0];

        // If receiver does not have "CURRENT" account..
        if(!senderAccount){
            res.status(400).send({
                message: "Sender account does not exist"
            })
        }
        if(!receiverAccount){
            res.status(400).send({
                message: "Receiver account does not exist"
            })
        }
        if(senderAccount.balance<amount){
            res.status(400).send({
                message: "Amount excedded"
            })
        }

        const senderBeforeTransactionAmount = senderAccount.balance;
        const receiverBeforeTransactionAmount = receiverAccount.balance;

        // Withdraw money from Sender's "CURRENT" account
        const subtractMoneyResponse = await subtractMoney(senderAccount.account_number, amount, "CURRENT");
        if(subtractMoneyResponse.rowCount==0){
            res.status(400).send({
                message: "Money could not be transferred"
            });
        }

        // Deposit money in Receiver's "CURRENT" account
        const addMoneyResponse = await addMoney(receiverAccount.account_number, amount, "CURRENT");
        console.log(addMoneyResponse);

        if(addMoneyResponse.rowCount==0){
            res.status(400).send({
                message: "Money could not be transferred"
            });
        }

        var finalAmount = amount;

        // If account is "CURRENT", then we need to put transaction charge of 0.5% of amount
        const transaction_charge = Math.min((amount/100) * 0.5, 500);
        const subtractMoneyResponse1 = await subtractMoney(senderAccount.account_number, transaction_charge, "CURRENT");
        finalAmount -= transaction_charge;


        // Now, we also need to keep this transaction in "transaction" table
        const transaction_number = generateTransactionNumber();

        const currentDate = Date(Date.now()).toString();
        const formattedDate = formatDate(currentDate);

        const result = await addTransaction(transaction_number, "TRANSFER", senderAccount.account_number, receiverAccount.account_number, amount, formattedDate, senderBeforeTransactionAmount, receiverBeforeTransactionAmount);

        if (result.rowCount==0) {
            // Query has not run properly
            res.status(400).send({
                message: "Transaction could not be done"
            });
            return;
        }

        res.status(200).send({
            message: "Money transferred"
        });
        
    } catch (error) {
        res.status(400).send({
            signup_error: 'Error while depositing the money'
        });
        console.error(error, "<-error");
    }
};



module.exports = {
    loan_repayment,
    deposit_money,
    withdraw_from_bank,
    withdraw_from_atm,
    transfer_money
}