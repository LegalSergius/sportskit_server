const {Product, ProductType, Media} = require("../model/model");
const fileSystem = require('fs');
const {Promotion} = require("../model/model");

function isExists(productName, description, price, productPhotosArray) {
    let errorsArray = [], resultMessage = '';

    if (!productName) {
        errorsArray.push('Не введено название товара');
    }
    if (!description) {
        errorsArray.push('Опишите добавляемый товар');
    }
    if (!price || price < 0) {
        errorsArray.push('Укажите стоимость продукта, большую 0');
    }
    if (productPhotosArray.length === 0) {
        errorsArray.push('Убедитесь в том, что добавлено, как минимум, 1 фото');
    }


    for (let i = 0; i < errorsArray.length; i++) {
        resultMessage += errorsArray[i];
        if (i !== errorsArray.length - 1) {
            resultMessage += '; ';
        }
    }

    return resultMessage;
}

function validateNumber(errorMsg, promotionSize) {
    if ((promotionSize <= 0) || (promotionSize > 100)) {
        let error = 'Укажите значение скидки от 0 до 100%';
        if (errorMsg !== '') {
            errorMsg += ', ' + error;
        } else {
            errorMsg += error;
        }
        console.log('error - ' + errorMsg);
    }

    return errorMsg;
}

async function getProductTypeFrom(typeOrId) {
    let isId = !isNaN(Number(typeOrId)), productType;

    if (isId) {
        productType = await ProductType.findByPk(typeOrId);
    } else {
        productType = await ProductType.findOne({where: {name: typeOrId}});
    }

    if (!productType) {
        productType = await ProductType.create({name: typeOrId});
    }

    return productType;
}

async function getProductBy(nameOrId) {
    let isId = !isNaN(Number(nameOrId));

    return (isId)? await Product.findByPk(nameOrId) : await Product.findOne({where: {name: nameOrId}});
}

async function sortProducts(sortingMethod, limit, offset, productType) {
    let tableObject;
    switch (sortingMethod) {
        case 'increasingPrices':
            tableObject = await Product.findAndCountAll({include: [Promotion], where: {productTypeId: productType.id},
                order: ['price'], limit, offset});
            break;
        case 'decreasingPrices':
            tableObject = await Product.findAndCountAll({include: [Promotion], where: {productTypeId: productType.id},
                order: [['price', 'DESC']], limit, offset});
            break;
        case 'popularSales':
            tableObject = await Product.findAndCountAll({include: [Promotion], where: {productTypeId: productType.id},
                order: [['sales', 'DESC']], limit, offset});
            break;
        case 'newestArrivals':
            tableObject = await Product.findAndCountAll({include: [Promotion], where: {productTypeId: productType.id},
                order: [['createdAt', 'DESC']], limit, offset});
            break;
        case 'byDiscountValues':
            tableObject = await Product.findAndCountAll({include: [Promotion], where: {productTypeId: productType.id},
                order: [[Promotion, 'size', 'DESC NULLS LAST']], limit, offset});
            break;
        default:
            tableObject = await Product.findAndCountAll({include: [Promotion], where: {productTypeId: productType.id},
                limit, offset});
            break;
    }

    return tableObject;
}

async function readFiles(fileNamesArray) {
    let resultArray = [];
    for (let element of fileNamesArray) {
        let buffer = fileSystem.readFileSync('C:/Users/User/mediaContent/' + element.path);
        let bitmap = new Buffer.from(buffer).toString('base64');

        resultArray.push(bitmap);
    }

    return resultArray;
}

async function getMediaArrayFromProducts(productsObject) {
    let mediaArray = [];
    for (let item of productsObject) {
        let productPhotos = await Media.findAll({where: {productId: item.id}});
        let mainPhoto = await readFiles([productPhotos[0]]);
        mediaArray.push({id: item.id, file: mainPhoto});
    }

    return mediaArray;
}

function capitalizeWord(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = {isExists, getProductTypeFrom, getProductBy, getMediaArrayFromProducts,
    capitalizeWord, validateNumber, readFiles, sortProducts}