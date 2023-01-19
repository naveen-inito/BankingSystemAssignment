const {
  signUpUser, signInUser,
} = require('../services/userProfleServices');

const signUp = async (req, res) => {
  try {
    const signUpUserResp = await signUpUser(req.body);
    return res.send(signUpUserResp);
  } catch (error) {
    return res.status(400).send({
      signup_error: 'Error while signing up..',
    });
  }
};

const signIn = async (req, res) => {
  try {
    const signinUserResp = await signInUser(req.body);
    return res.send(signinUserResp);
  } catch (error) {
    return res.status(400).send({
      signin_error: 'Error while logging in..',
    });
  }
};

module.exports = {
  signUp, signIn,
};
