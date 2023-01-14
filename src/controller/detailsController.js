const { getAccountNumber, getAllTransactionsOfUser, getAllTransactionsOfAccount } = require("../services/accountServices");


const get_account_details = async (req, res) => {
    try {
        const {username} = req.body;
        const user_id = getUserId(username);
        
        const savingAccountDetails = await getUserAccountDetailsOfParticularType(user_id, "SAVINGS");
        const currentAccountDetails = await getUserAccountDetailsOfParticularType(user_id, "CURRENT");
        const loanAccountDetails = await getUserAccountDetailsOfLoanAccount(user_id);

        const saving_account = savingAccountDetails.rows[0];
        const current_account = currentAccountDetails.rows[0];
        const loan_account = loanAccountDetails.rows[0];

        var responseToSend = {
            "Savings": saving_account,
            "Current": current_account,
            "Loan": loan_account
        };

        res.status(200).send(
            JSON.stringify(responseToSend)
        );
        
    } catch (error) {
        res.status(400).send({
            signup_error: 'Error while fetching account details'
        });
        console.error(error, "<-error");
    }
};


const get_passbook = async (req, res) => {
    try {
        const {username, account_type} = req.body;

        const user_id = getUserId(username);

        const aRow = getAccountNumber(user_id, account_type);

        if(!aRow){
            res.status(200).send({
                message: "Account does not exist"
            })
            return;
        }
        
        const account_number = aRow.account_number;

        const result = await getAllTransactionsOfAccount(account_number);
        
        res.status(200).send(
            JSON.stringify(result.rows)
        );
    } catch (error) {
        res.status(400).send({
            signup_error: 'Error while fetching account details'
        });
        console.error(error, "<-error");
    }
};

module.exports = {
    get_account_details,
    get_passbook
}