

const { pool } = require('../db/connection');
const {subtractMoney, generateTransactionNumber, addTransaction, getTransactionCountForAccount, getMinBalance, addMoney} = require("../utils/common")

const schedule = require('node-schedule');
const { formatDate } = require('../utils/utilities');


// Job for calculating interest on "SAVINGS" account...
// This job should run "ONCE A MONTH"
// const jobString = "*/10 * * * * *";
const jobString = "0 0 1 * *";
const schduleJobForCalculatingInterestOnSavingAccount = schedule.scheduleJob(jobString, async () => {

    try{
        const currentDate = Date(Date.now()).toString();
        const formattedDate = formatDate(currentDate);

        // Getting all the savings account
        const result = await pool.query(
            `select * from accounts where account_type = 'SAVINGS'`
        );
        
        const all_users = result.rows;
        const numberOfRows = result.rows.length;

        for (var i = 0; i < numberOfRows; i++) {
            const currentAccount = all_users[i]

            // Code for getting minimum balance for each day for whole month
            var d = new Date(Date.now());
            var prevDate = new Date(d);
            prevDate.setDate(prevDate.getDate() - 1);
            var month = '' + (prevDate.getMonth() + 1);
            var day = '' + prevDate.getDate();
            var year = prevDate.getFullYear();

            var no_of_days = day;

            const minBalance = await getMinBalance(month, year, currentAccount.account_number, currentAccount.balance, day);
            console.log(minBalance);

            const number_of_days = minBalance.length - 1;


            var totalNRVofWholeMonth = 0;
            for(var i=1; i<=number_of_days; i++){
                totalNRVofWholeMonth += minBalance[i];
            }

            var averageAmountOfWholeMonth = totalNRVofWholeMonth/number_of_days;

            // var interestToBeAdded = ((averageAmountOfWholeMonth/100) * 6) /12;
            var interestToBeAdded = parseInt(((averageAmountOfWholeMonth/100) * 6) /12);

            // Now, we need to add this amount to the user's savings account...
            const result = await addMoney(currentAccount.account_number, interestToBeAdded, "SAVINGS");

            // We need to also add this to the transaction
            const result2 = await addTransaction(0, "INTEREST_EARNED", null, currentAccount.account_number, interestToBeAdded, formattedDate, null, currentAccount.balance);
            
            var newBalance = currentAccount.balance + interestToBeAdded;
            
            // If NRV falls below 100000, then we should charge Rs. 1000 to the user...
            if(totalNRVofWholeMonth<100000){
                const result3 = await subtractMoney(currentAccount.account_number, 1000, "SAVINGS");

                const result4 = await addTransaction(0, "PENALTY_FOR_NRV", currentAccount.account_number, null, interestToBeAdded, formattedDate, newBalance, null);
            }
        }
    } catch (error) {
        console.log(error , " << error")
    }
});