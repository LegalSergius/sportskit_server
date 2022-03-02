const jwt = require('jsonwebtoken');
const {printMessage} = require("./userMiddleware");

async function check(request, response) {
    const token = generateToken(request.user.id, request.user.emailOrPhone, request.user.roleId);
    return response.json({token});
}

function generateToken(id, emailOrPhone, name, surname, role) {
    return jwt.sign({id, emailOrPhone, name, surname, role},
        process.env.SECRET_KEY, {expiresIn: '48h'});
}

function checkTokenValidity(request, response, next) {
    if (request.method === 'OPTIONS') {
        next();
    }
    try {
        const token = request.headers.authorization.split(' ')[1];
        console.log(token);
        if (!token) {
            return response.status(401).json(printMessage('Пользователь не авторизован'));
        }
        const decodedData = jwt.verify(token, process.env.SECRET_KEY);
        request.user = decodedData;
        next();
    } catch(e) {
        return response.status(401).json(printMessage('Ошибка при валидации токена'));
    }
}

module.exports = {checkTokenValidity, check, generateToken}