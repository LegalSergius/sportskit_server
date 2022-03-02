const {printMessage} = require("./userMiddleware");

function isNotEqual(password, confirmPassword) {
    return (password !== confirmPassword);
}

function isNotExists(name, surname) {
    return (!name || !surname);
}

function normalizePhoneNumber(phone) {
    let doesHavePlus = (phone[0] === '+');

    if (doesHavePlus) {
        phone = phone.slice(1);
    }
    console.log('длина номера - ' + phone.length);
    if (!phone.match(/\d{11}/) || phone.length > 11) {
        return -1;
    } else {
        if (doesHavePlus) {
            return '+' + phone;
        } else {
            return '+7' + phone.slice(1);
        }
    }
}

function sendErrorsOrCheckIsPhoneNumber(expressionsObject, response) {
    let expression = expressionsObject.array(), size = expression.length,
        resultMessage = '', emailOrPhone = '';
    for (let i = 0; i < size; i++) {
        let arrayItem = expression[i];
        if (arrayItem['param'] === 'emailOrPhone') {
            const numberStatus = normalizePhoneNumber(arrayItem['value']);
            if (numberStatus === -1) {
                resultMessage += 'Некорректный email или неверный набор Вашего номера телефона';
            } else {
                emailOrPhone = numberStatus;
            }
        } else {
            resultMessage += arrayItem['msg'];
        }

        if (i !== (size - 1) && resultMessage !== '') {
            resultMessage += ', ';
        }
    }

    if (resultMessage !== '') {
        return response.status(400).json(printMessage(resultMessage));
    }

    return emailOrPhone;
}

module.exports = {isNotEqual, sendErrorsOrCheckIsPhoneNumber, isNotExists};