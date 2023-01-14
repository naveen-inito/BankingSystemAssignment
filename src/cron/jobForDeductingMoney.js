

const { pool } = require('../db/connection');

const schedule = require('node-schedule');
const { subtractMoney, addTransaction, getTransactionCountForAccount, getMinBalance } = require('../services/accountServices');
const { generateTransactionNumber, formatDate } = require('../utils/utils');


// This job should run "ONCE A MONTH"
// This should only happen for "CURRENT" account
// const jobString = "*/10 * * * * *";
const jobString = "55 23 * * *";
const schduleJobForDeductingMoneyForLessTransactions = schedule.scheduleJob(jobString, async () => {

    try{
        // Checking the number of transactions from "accounts" table for every user

        const result = await pool.query(
            `select * from accounts where account_type = 'CURRENT'`
        );
        
        const allAccounts = result.rows;
        const numberOfRows = result.rows.length;

        const currentDate = Date(Date.now()).toString();
        const formattedDate = formatDate(currentDate);

        var d = new Date(Date.now());
        var prevDate = new Date(d);
        prevDate.setDate(prevDate.getDate() - 1);
        var month = '' + (prevDate.getMonth() + 1);
        var day = '' + prevDate.getDate();
        var year = prevDate.getFullYear();

        for (var i = 0; i < numberOfRows; i++) {
            const currentAccount = allAccounts[i]

            const transaction_count_response = await getTransactionCountForAccount(currentAccount.account_number, currentDate);
            const transaction_count_for_user = transaction_count_response.rows[0].count;

            // console.log(currentAccount.account_number, " -> ", transaction_count_for_user);

            var newBalance = currentAccount.balance;
            if(transaction_count_for_user<3){
                // Now, deduct amount of 500 from this account
                const subtractMoneyResponse = await subtractMoney(currentAccount.account_number, 500, currentAccount.account_type);

                if(subtractMoneyResponse.rowCount==0){
                    console.log(`Was't able to deduct penalty of 500 from User's account: ${currentAccount}`)
                }else{
                    // Now, we also need to keep this transaction in "transaction" table
                    // const transaction_number = generateTransactionNumber();

                    const result = await addTransaction(0, "PENALTY_FROM_BANK", currentAccount.account_number, null, 500, formattedDate, currentAccount.balance, null);

                    if (result.rowCount==0) {
                        // Query has not run properly
                        console.log("Transaction could not be registered")
                    }
                    newBalance -= 500;
                }
            }

            const minBalance = await getMinBalance(month, year, currentAccount.account_number, currentAccount.balance, day);

            const number_of_days = minBalance.length - 1;
            var totalNRVofWholeMonth = 0;
            for(var i=1; i<=number_of_days; i++){
                totalNRVofWholeMonth += minBalance[i];
            }

            // If NRV falls below 100000, then we should charge Rs. 1000 to the user...
            if(totalNRVofWholeMonth<500000){
                const result3 = await subtractMoney(currentAccount.account_number, 5000, "CURRENT");
                const result4 = await addTransaction(0, "PENALTY_FOR_NRV", currentAccount.account_number, null, 5000, formattedDate, newBalance, null);
            }
        }
    } catch (error) {
        console.log(error , " << error")
    }
});
