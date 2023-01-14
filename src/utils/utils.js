

const create_mapper = () => {    
    var map = [];
    map.length = 26;

    map[0] = 1;
    for (let i = 1; i < 26; i++) {
        map[i] = 2*map[i-1] + 1;
    }
    return map;
}

const formatDate = (date) => {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
}

const subtract6Months = async (date) => {
    const dateCopy = new Date(date);
    console.log(dateCopy)
    dateCopy.setMonth(dateCopy.getMonth() - 6);
    return dateCopy;
}

const getNumberOfDays = async (firstDate, secondDate) => {
    const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    const diffDays = Math.round(Math.abs((firstDate - secondDate) / oneDay));
    return diffDays;
}


const getUserId = (username) => {
    var map = create_mapper();
    var user_id = 0;
    for (var i = 0; i < username.length; i++) {
        const current_character = username.charCodeAt(i);
        if(65<=current_character && current_character<=90){
            user_id += map[current_character - '65'];
        }else if(97<=current_character && current_character<=122) {
            user_id += map[current_character - '97'];
        }
    }
    return user_id;
};

const calculate_age = (dob) => {

    const birthDate = dob.getDate();
    const birthMonth = dob.getMonth()+1;
    const birthYear = dob.getFullYear();

    var d = new Date(Date.now()),
        currentMonth = '' + (d.getMonth() + 1),
        currentDay = '' + d.getDate(),
        currentYear = d.getFullYear();

    var age = currentYear - birthYear - 1;
    if(currentMonth > birthMonth){
        age++;
    }
    if(currentMonth==birthMonth && currentDay>=birthDate){
        age++;
    }
    return age;
}

const getLastDayOfMonthYear = async (y,m) => {
    return (new Date(y, m+1, 0).getDate());
}

const generateTransactionNumber = () => {
    const number = BigInt(generate_account_no(15));
    return number;
}

const makeid = (length, character_set) => {
    var result = "";
    var characters = character_set;
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
};


const generate_account_no = (length) => {
    var character_set1 = "123456789";
    var result1 = makeid(1, character_set1);

    var character_set2 = "0123456789";
    var result2 = makeid(length - 1, character_set2);

    var result = result1 + result2;
    return result;
}

module.exports = {
    getUserId,
    calculate_age, formatDate,
    getLastDayOfMonthYear,
    subtract6Months,
    getNumberOfDays,
    generate_account_no,
    generateTransactionNumber,
    makeid
}