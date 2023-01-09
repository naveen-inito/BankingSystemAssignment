



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

    // console.log(username, ' ---> ', user_id);
    return user_id;
};

const calculate_age = (dob) => {
    // var dob = '19800810';
    // var year = Number(dob.substr(0, 4));
    // var month = Number(dob.substr(4, 2)) - 1;
    // var day = Number(dob.substr(6, 2));
    // var today = new Date();
    // var age = today.getFullYear() - year;
    // if (today.getMonth() < month || (today.getMonth() == month && today.getDate() < day)) {
    // age--;
    // }
    // alert(age);
    console.log(dob);
    return 21;
}


module.exports = {
    getUserId,
    calculate_age, formatDate
};