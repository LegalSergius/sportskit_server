const {User} = require("../model/model");

async function getUserEmailOrPhone(emailOrPhone) {
    return await User.findOne({where: {emailOrPhone}});
}

function printMessage(expression) {
    return {message: expression};
}

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

module.exports = {getUserEmailOrPhone, getRandomNumber, printMessage};