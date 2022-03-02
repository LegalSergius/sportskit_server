require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const indexRouter = require('./routes/index');
const sequelize = require('./configurations/dataBaseTrigger');
const cors = require('cors');

let app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use('/api', indexRouter);

const appPort = process.env.PORT || 5500;

const main = async() => {
    try {
        await sequelize.authenticate();
        await sequelize.sync();

        app.listen(appPort, () => {
            console.log('Инициализация сервера');
        });
        console.log('Успешное выполнение функции.');
    } catch (e) {
        console.log('index.js - ошибка - ' + e);
    }
}

main();
