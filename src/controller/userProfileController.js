const {
  signUpUser, signInUser,
} = require('../services/userProfleServices');

const signUp = async (req, res) => {
  try {
    const {
      username, name, email, password, dob, address,
    } = req.body;
    const phoneNo = req.body.phone_no;
    const signUpUserResp = await signUpUser({
      username, name, email, password, phoneNo, dob, address,
    });
    return res.send(signUpUserResp);
  } catch (error) {
    return res.status(400).send({ signup_error: 'Error while signing up..' });
  }
};

const signIn = async (req, res) => {
  try {
    const { username, password } = req.body;
    const signinUserResp = await signInUser({ username, password });
    return res.send(signinUserResp);
  } catch (error) {
    return res.status(400).send({ signin_error: 'Error while logging in..' });
  }
};

module.exports = {
  signUp, signIn,
};
