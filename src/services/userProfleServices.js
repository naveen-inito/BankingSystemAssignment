const { pool } = require('../db/connection');
const { getUserId } = require("../utils/utils");

const getUserDetails = async (user_id) => {
    const result = await pool.query(
        'select * from bank_user where id = $1',
        [user_id]
    );

    const user = result.rows[0];
    return user;
}

const userExists = async ({email}) => {
    const result = await pool.query(
        'select count(*) as count from bank_user where email=$1',
        [email]
    );
    
    const count = result.rows[0].count;
    return count==1;
}


const registerUser = async ({username, name, email, password, phone_no, dob, address}) => {
    const userId = getUserId(username);
    const hashedPassword = await bcrypt.hash(password, 8);
    await pool.query(
        'insert into bank_user(id, username, name, email, password, phone_no, dob, address) values($1,$2,$3,$4, $5, $6, $7, $8)',
        [userId, username, name, email, hashedPassword, phone_no, dob, address]
    );
}

const generateAuthToken = async (user) => {
    const { id, username } = user;
    const token = await jwt.sign(
        { id, username },
        secret,
        {
            expiresIn: "12h",
        }
    );
    return token;
};


module.export = {
    userExists,
    registerUser,
    generateAuthToken,
    getUserDetails
}