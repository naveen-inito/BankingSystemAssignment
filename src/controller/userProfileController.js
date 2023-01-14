
const { userExists, registerUser, validateUser, generateAuthToken } = require("../services/userProfleServices");

const signUp = async (req, res) => {
    try {
        console.log(req.body);
        const { username, name, email, password, phone_no, dob, address} = req.body;

        const userCount = await userExists(email);
        
        if (userCount>0) {
            return res.status(400).send({
                signup_error: 'User with this email address already exists.'
            });
        }

        await registerUser({username, name, email, password, phone_no, dob, address});

        res.status(201).send({
            message: "User created"
        });
    } catch (error) {
        res.status(400).send({
            signup_error: 'Error while signing up..Try again later.'
        });
        console.error(error, "<-error");
    }

}


const signIn = async (req, res) => {
    try{
        const { username, password } = req.body;
        const user = await validateUser(username, password);
        if (!user) {
            res.status(400).send({
                sigin_error: 'Email/password does not match.'
            });
        }
        // NOW, the user is already validated

        // handle the case when user is already logged in
        const token = await generateAuthToken(user);
        user.token = token;
        delete user.password;
        res.send(user);
    } catch (error) {
        console.log(error+" <- error");
        res.status(400).send({
            signin_error: 'Email/password does not matching.'
        });
    }
}


module.exports = {
    signUp, signIn
}