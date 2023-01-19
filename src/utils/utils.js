const createMapper = () => {
  const map = [];
  map.length = 26;

  map[0] = 1;
  for (let currentCharPosition = 1; currentCharPosition < 26; currentCharPosition += 1) {
    map[currentCharPosition] = 2 * map[currentCharPosition - 1] + currentCharPosition;
  }
  return map;
};

const formatDate = (date) => {
  const d = new Date(date);
  let month = `${d.getMonth() + 1}`;
  let day = `${d.getDate()}`;
  const year = d.getFullYear();

  if (month.length < 2) { month = `0${month}`; }
  if (day.length < 2) { day = `0${day}`; }

  return [year, month, day].join('-');
};

const getNumberOfDays = async (firstDate, secondDate) => {
  const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
  const diffDays = Math.round(Math.abs((firstDate - secondDate) / oneDay));
  return diffDays;
};

const getUserId = (username) => {
  const map = createMapper();
  let id = 0;
  for (let usernamePosition = 0; usernamePosition < username.length; usernamePosition += 1) {
    const currentharacter = username.charCodeAt(usernamePosition);
    if (currentharacter >= 65 && currentharacter <= 90) {
      id += map[currentharacter - '65'];
    } else if (currentharacter >= 97 && currentharacter <= 122) {
      id += map[currentharacter - '97'];
    }
  }
  return id;
};

const calculateAge = (dob) => {
  const birthDate = dob.getDate();
  const birthMonth = dob.getMonth() + 1;
  const birthYear = dob.getFullYear();

  const d = new Date(Date.now());
  const currentMonth = `${d.getMonth() + 1}`;
  const currentDay = `${d.getDate()}`;
  const currentYear = d.getFullYear();

  let age = currentYear - birthYear - 1;
  if (currentMonth > birthMonth) {
    age += 1;
  }
  if (currentMonth === birthMonth && currentDay >= birthDate) {
    age += 1;
  }
  return age;
};

const getLastDayOfMonthYear = async (y, m) => (new Date(y, m + 1, 0).getDate());

const makeid = (length, characterSet) => {
  let result = '';
  const characters = characterSet;
  const charactersLength = characters.length;
  for (let position = 0; position < length; position += 1) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const generateAccountNo = (length) => {
  const characterSet1 = '123456789';
  const result1 = makeid(1, characterSet1);

  const characterSet2 = '0123456789';
  const result2 = makeid(length - 1, characterSet2);

  const result = result1 + result2;
  return result;
};

const generateTransactionNumber = () => {
  const number = BigInt(generateAccountNo(15));
  return number;
};

module.exports = {
  getUserId,
  calculateAge,
  formatDate,
  getLastDayOfMonthYear,
  getNumberOfDays,
  generateAccountNo,
  generateTransactionNumber,
  makeid,
  createMapper,
};
