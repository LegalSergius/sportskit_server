const Router = require('express');
const {check, validationResult} = require('express-validator');
const {User, Role, Basket} = require('../../model/model');
const bcrypt = require('bcrypt');
const smsc = require('../../configurations/smsc')
const {sendErrorsOrCheckIsPhoneNumber, isNotExists, isNotEqual} = require("../../middleware/authMiddleware");
const {generateToken, checkTokenValidity} = require('../../middleware/tokenMiddleware');
const {printMessage, getUserEmailOrPhone, getRandomNumber} = require('../../middleware/userMiddleware');
let pin = null;

let authRouter = new Router();
authRouter.post('/registration', [
    check('emailOrPhone', 'Некорректный email').isEmail(),
    check('password', 'Минимальная длина пароля - 5 символов').isLength({min: 5})
], async (request,
          response) => {
    let {emailOrPhone, password, validationPassword, name, surname} = request.body;

    if (isNotExists(name, surname)) {
        return response.status(400).json(printMessage('Проверьте заполненность полей'));
    }
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
        emailOrPhone = sendErrorsOrCheckIsPhoneNumber(errors, response);
    }

    if (isNotEqual(password, validationPassword)) {
        return response.status(400).json(printMessage('Введенные пароли не совпадают'));
    }
    if (await getUserEmailOrPhone(request.body.emailOrPhone)) {
        return response.status(401).json(printMessage('Пользователь с ' +
            'данным Email или телефоном существует'));
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 6);
        let role = await Role.findOne({where: {role: 'USER'}});
        if (!role) {
            await Role.create({role: 'ADMIN'});
            role = await Role.create({role: 'USER'});
        }

        let user = await User.create({emailOrPhone, password: hashedPassword, name, surname, roleId: role.id})
                                .catch(() => {
                                        response.status(500).json(printMessage('Пользователь с ' +
                                            'данным Email или телефоном существует'))
                                });
        const userBasket = await Basket.create({userId: user.id});

        const token = generateToken(user.id, user.emailOrPhone, user.name, user.surname, role.role);

        return response.status(200).json({token, basketId: userBasket.id});
    } catch(e) {
        console.log('ошибка выполнения ' + e.message);
        response.status(500).json(printMessage('Ошибка при выполнении запроса'));
    }
});

authRouter.post('/login', [
    check('emailOrPhone', 'Некорректный email').isEmail(),
    check('password', 'Не введен пароль').notEmpty()
], async (request,
          response) => {
    let {emailOrPhone, password} = request.body;

    const errors = validationResult(request);
    if (!errors.isEmpty()) {
        emailOrPhone = sendErrorsOrCheckIsPhoneNumber(errors, response);
    }

    try {
        const isAdmin = (request.query.parameter === 'ADMIN');
        const user = await getUserEmailOrPhone(emailOrPhone);
        if (!user) {
            return response.status(403).json(printMessage('Такого пользователя не существует'));
        }

        let role = await Role.findByPk(user.roleId);
        if (isAdmin) {
            if (role.role !== 'ADMIN') {
                return response.status(403).json(printMessage('Доступ запрещен. Вы - не администратор.'));
            }
        }
        if (!await bcrypt.compare(password, user.password)) {
            return response.status(403).json(printMessage('Введен неверный пароль'));
        }
        const userBasket = await Basket.findOne({where: {userId: user.id}});

        console.log(role.role);
        const token = generateToken(user.id, user.emailOrPhone, user.name,
            user.surname, role.role);
        return response.status(200).json({token, basketId: userBasket.id});
    } catch(e) {
         console.log('ошибка login - ' + e.message);
         response.status(500).json({message: 'Ошибка при выполнении запроса.'});
    }
});

authRouter.get('/getUserBy/:emailOrPhone', [
    check('emailOrPhone', 'Некорректный email').isEmail()
], async (request, response) => {
    let emailOrPhone = request.params.emailOrPhone;

    const errors = validationResult(request);
    if (!errors.isEmpty()) {
        emailOrPhone = sendErrorsOrCheckIsPhoneNumber(errors, response);
    }
    const user = await getUserEmailOrPhone(emailOrPhone);
    if (!user) {
        return response.status(403).json(printMessage('Такого пользователя не существует'));
    }

    return response.status(200).json({user});
});

authRouter.get('/check', checkTokenValidity, async (request, response) => {
    const token = generateToken(request.user.id, request.user.emailOrPhone,
        request.user.name, request.user.surname, request.user.role);

    return response.status(202).json({token});
});

authRouter.get('/sendPINCode/:emailOrPhone', [
    check('emailOrPhone', 'Некорректный Email').isEmail()
], async (request, response) => {
    let emailOrPhone = request.params.emailOrPhone;

    const errors = validationResult(request);
    if (!errors.isEmpty()) {
        emailOrPhone = sendErrorsOrCheckIsPhoneNumber(errors, response);
    }
    const pinCode = getRandomNumber(100000, 1000000);
    const user = await getUserEmailOrPhone(emailOrPhone);
    console.log(user);

    emailOrPhone = user.emailOrPhone;
    let isNumber = (emailOrPhone[0] === '+');
    const messageToUser = 'Уважаемый/ая ' + user.surname + ' ' + user.name + ', к нам поступил запрос о смене пароля, привязанного к '
        + (isNumber? 'данному ' : 'данной ')
        + (isNumber? 'номеру телефона' : 'электронной почте') + '. Код подтверждения для обновления пароля : ' + pinCode;

    smsc.configure({
        login: 'legalSergius',
        password: 'a567A567',
        ssl: false,
        charset: 'utf-8'
    });

    if (isNumber) {
        smsc.send_sms({
            phones: emailOrPhone,
            mes: messageToUser
        },function(data, raw, err) {
            if (err) {
                console.log(err);
            }
            console.log(raw);
        });
    } else {
        let a = smsc.send('mail', {
            phones: emailOrPhone,
            mes: messageToUser,
            subj: 'ЗАБЫВАЛИ ЛИ ВЫ СВОЙ ПАРОЛЬ?',
            sender: 'strong@mail'
        }, function(data, raw, err) {
            if (err) {
                console.log(err);
            }
            console.log(raw);
        });
        console.log('отправка почты а - ' + a);
    }

    pin = pinCode;

    return response.status(200).json(printMessage('Ok'));
});

authRouter.post('/checkPINCode', [
    check('validationCode', 'Не введен код').notEmpty()
], async (request, response) => {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
        sendErrorsOrCheckIsPhoneNumber(errors, response);
    }

    console.log(pin);
    if (Number(request.body.validationCode) === pin) {
        pin = null;
        return response.status(200).json(printMessage('Ok'));
    }

    return response.status(403).json(printMessage('Введен неверный код'));
})


authRouter.put('/updateUser/:userId', [
    check('password', 'Минимальная длина нового пароля - 5 символов').isLength({min: 5})
], async (request,
          response) => {
    let updatableUserId = request.params.userId;

    const errors = validationResult(request);
    if (!errors.isEmpty()) {
        sendErrorsOrCheckIsPhoneNumber(errors, response);
    }
    try {
        await User.update(request.body, {where: {updatableUserId}});

        return response.status(200).json(printMessage('Ok'));
    } catch(e) {
        console.log('update error - ' + e.message);
    }
});

module.exports = authRouter;