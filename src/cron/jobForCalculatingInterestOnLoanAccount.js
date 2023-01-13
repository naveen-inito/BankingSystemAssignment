

const { pool } = require('../db/connection');
const {subtractMoney, generateTransactionNumber, addTransaction, getTransactionCountForAccount, getMinBalance, getMinBalanceOfLoanAccount, addMoney} = require("../utils/common")

const schedule = require('node-schedule');
const { formatDate, getLastDayOfMonthYear, subtract6Months } = require('../utils/utilities');

// Job for calculating interest on "LOAN" account...
// This job should run "ONCE PER DAY"
// Interest for an account is calculated every 6 months
// const jobString = "*/10 * * * * *";
const jobString = "55 23 * * *";
const schduleJobForCalculatingInterestOnLoanAccount = schedule.scheduleJob(jobString, async () => {

    try{

        const currentDate = Date(Date.now()).toString();
        const formattedDate = formatDate(currentDate);

        // Getting the 
        const result = await pool.query(
            `select T1.account_number, T1.user_id, T1.created_at, T2.loan_type, T2.interest, T1.balance, T2.amount, T2.duration
            FROM accounts AS T1, loan_account AS T2
            WHERE T1.account_number = T2.account_number
            AND T1.account_type = 'LOAN'
            AND T2.status = 'active'`
        );
        const allLoanAccounts = result.rows;
        const numberOfRows = result.rows.length;

        var todayDate = new Date(Date.now()),
            currentMonth = '' + (todayDate.getMonth() + 1),
            currentDay = '' + todayDate.getDate(),
            currentYear = todayDate.getFullYear();

        const lastDateOfMonth = await getLastDayOfMonthYear(currentYear, currentMonth);

        for (var i = 0; i < numberOfRows; i++) {
            const currentAccount = allLoanAccounts[i]
            // console.log(currentUser)

            // Checking whether month is modulo of 6, or not
            console.log(currentAccount);
            // console.log(currentAccount.created_at);
            console.log(currentAccount.created_at.getDate());
            console.log(currentAccount.created_at.getMonth()+1);
            console.log(currentAccount.created_at.getFullYear());
            
            const creationDateOfLoanAccount = currentAccount.created_at.getDate();
            const creationMonthOfLoanAccount = currentAccount.created_at.getMonth()+1;
            const creationYearOfLoanAccount = currentAccount.created_at.getFullYear();

            var interestToBeAdded = currentAccount.interest;

            // Checking whether the loan is defaulted or not
            if(((currentDay>creationDateOfLoanAccount && currentMonth==creationMonthOfLoanAccount) || (currentMonth>creationMonthOfLoanAccount)) && currentYear-creationYearOfLoanAccount>=currentAccount.duration){
                // then loan is defaulted
                const update_status = await pool.query(
                    `UPDATE loan_account
                    set status = 'default'
                    where account_number = $1`,
                    [currentAccount.account_number]
                );
                continue;
            }

            if(creationDateOfLoanAccount==currentDay && creationMonthOfLoanAccount==currentMonth && creationYearOfLoanAccount==currentYear){
                // Loan is created on this date, so can't add interest here
                continue;
            }
            if((creationMonthOfLoanAccount-currentMonth+12)%6!=0){
                // Month is not right to add interest
                continue;
            }

            if(creationDateOfLoanAccount<currentDay){
                // interest for this account is already calculated some days before
                continue;
            }

            if(currentDay!=lastDateOfMonth && creationDateOfLoanAccount>currentDay){
                // since, it is not last date of month, and we have creationDateOfLoanAccount further of us, so we'll need to calculate interest on some upcoming days
                continue;
            }

            // Now, this is the correct day to calculate interest

            // Calculating amount, in which  interest is to be calculated
            // ----------------------------------------------------------------------------------
            // ---------- NEED TO WORK ON THIS --------------------------
            // const amount = currentAccount.balance;

            // --- First try -----
            // const startDate = await subtract6Months(todayDate);
            // console.log(startDate);
            // var numberOfDays = 0;
            // var dateCounter = startDate;
            // while(dateCounter <= todayDate){
            //     numberOfDays++;
            //     dateCounter.setDate(dateCounter.getDate() + 1);
            // }
            // console.log(numberOfDays)
            // --- First try -----

            // --- Second try ---
            // We can get the last date from transaction table on which interest amount was added on this account
            const lastInterestAddedDateQuery = await pool.query(
                `select *
                FROM transaction
                WHERE account_no = $1
                AND transaction_type = 'LOAN_INTEREST_ADDED'
                ORDER BY date_of_transaction DESC`,
                [currentAccount.account_number]
            );
            var lastInterestAddedDate = new Date(Date.now());
            if(lastInterestAddedDateQuery.rows.length==0){
                // No interest is added till now, so we need to get the loan_account creation date
                // lastInterestAddedDate = new Date(currentAccount.created_at);
                lastInterestAddedDate = currentAccount.created_at;
            }else{
                // just get this date
                // lastInterestAddedDate = new Date(lastInterestAddedDateQuery.rows[0].date_of_transaction);
                lastInterestAddedDate = lastInterestAddedDateQuery.rows[0].date_of_transaction;
            }
            // console.log(lastInterestAddedDate+"<<")
            var numberOfDays = 0;
            var dateCounter = new Date(lastInterestAddedDate);
            console.log(dateCounter)
            while(dateCounter <= todayDate){
                numberOfDays++;
                // console.log(dateCounter+"<<")
                dateCounter.setDate(dateCounter.getDate() + 1);
            }
            // console.log(lastInterestAddedDate+"<<--")
            // console.log(numberOfDays+", "+lastInterestAddedDate+", "+todayDate)

            const minBalance = await getMinBalanceOfLoanAccount(lastInterestAddedDate, todayDate, numberOfDays, currentAccount.account_number, currentAccount.balance);
            
            console.log(minBalance);
            console.log(numberOfDays+" , numberOfDays, ",todayDate);
            // --- Second try ---

            numberOfDays = minBalance.length;
            var total = 0, count = 0;
            for( var i=1; i<numberOfDays; i++){
                total = total + minBalance[i];
                count++;
            }
            var average = total/count;

            var interestToAdd = parseInt(((average/100) * interestToBeAdded) /2);
            // ----------------------------------------------------------------------------------

            console.log("1st checkpoint, ", interestToAdd, ", ", average,", ", total,", ",count, ", ", numberOfDays)
            
            
            // const interestToAdd = parseInt((amount * currentAccount.interest) / (100*2));
            // console.log(amount + " -> " + interestToAdd);
            const result = await addMoney(currentAccount.account_number, interestToAdd, "LOAN");
            

            console.log("2nd checkpoint")

            // We need to also add this to the transaction
            const result2 = await addTransaction(0, "LOAN_INTEREST_ADDED", null, currentAccount.account_number, interestToAdd, formattedDate, null, currentAccount.balance);

            console.log("3rd checkpoint")
        }
    } catch (error) {
        console.log(error , " << error")
    }
});