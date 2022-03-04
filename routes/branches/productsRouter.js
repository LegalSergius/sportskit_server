const Router = require('express');
const multer = require('multer');
const fileSystem = require('fs');
const {getProductBy, validateNumber, readFiles, sortProducts,
    getMediaArrayFromProducts, capitalizeWord, getProductTypeFrom, isExists} = require("../../middleware/productsMiddleware");
const {printMessage} = require("../../middleware/userMiddleware");
const {Media, Product, PromoCode, Promotion} = require("../../model/model");
let productPhotosArray = [];

let storage = multer.diskStorage({
    destination: function(request, file, cb) {
        cb(null, 'C:/Users/User/mediaContent');
    },
    filename: function(request, file, cb) {
        let fileName = String(new Date().getTime()) + '.' + file.originalname.split('.').pop();
        cb(null, fileName);
        productPhotosArray.push(fileName);
    }
});
const upload = multer({storage: storage});

let productsRouter = new Router();
productsRouter.post('/addProduct/:productType',
    upload.fields([{name: 'photosArray', maxCount: 3}]),
    async(request,
                response) => {
    const type = request.params.productType;
    let sales = 0, productType;
    let {productName, description, price} = request.body;
    const errorMessage = isExists(productName, description, price, productPhotosArray);

    if (errorMessage !== '') {
        productPhotosArray = [];
        return response.status(400).json(printMessage(errorMessage));
    } else {
        productType = await getProductTypeFrom(type);

        await Product.create({name: capitalizeWord(productName), description: capitalizeWord(description),
            price, sales, productTypeId: productType.id}).then(async(result) => {
                    const productId = result.id;
                    for (let i = 0; i < productPhotosArray.length; i++) {
                        await Media.create({path: productPhotosArray[i], productId});
                    }
                }).catch((error) => {
                    console.log(error);
                });
    }

    productPhotosArray = [];
    return response.status(200).json(printMessage('Ok'));
});

productsRouter.post('/addPromotion', upload.none(),
    async(request,
                  response) => {
    let {productName, price} = request.body;
    let errorMsg = '', promotionSize = Number(price);
    const product = await getProductBy(productName);
    if (!product) {
        errorMsg += 'Товара с таким именем не существует';
    }
    errorMsg = validateNumber(errorMsg, promotionSize);
    if (errorMsg !== '') {
        return response.status(400).json(printMessage(errorMsg));
    }

    if (await Promotion.findOne({where : {productId: product.id}})) {
        return response.status(400).json(printMessage('На товар можно установить только одну акцию'));
    }

    const title = '-' + promotionSize + '% на товар ' + productName;

    await Promotion.create({title, size: promotionSize}).then((promotion) => {
       product.setPromotion(promotion).catch((error) => {
           console.log('relative error - ' + error);
       })
    }).catch((error) => {
        console.log('promotion error - ' + error);
    });

    return response.status(200).json(printMessage('Ok'));
});
productsRouter.post('/addPromocode/:productType',
    upload.none(), async(request,
                response) => {
    let {promo, price} = request.body, errorMsg = '';
    if (promo.length !== 6) {
        errorMsg += 'Убедитесь, что Ваш промо-код имеет 6 знаков';
    }
    errorMsg = validateNumber(errorMsg, price);
    if (errorMsg !== '') {
        return response.status(400).json(printMessage(errorMsg));
    }

    let productType = await getProductTypeFrom(request.params.productType);
    await PromoCode.create({code: promo, size: price, productTypeId: productType.id})
        .catch((error) => {
            console.log('error - ' + error);
        });

    return response.status(200).json(printMessage('Ok'));
});

productsRouter.get('/getProducts', async (request,
                                         response) => {
    const mediaRequired = request.query.mediaRequired, option = request.query.option;
    let tableObject, productsObject, countOfSales = 0;
    if (mediaRequired === 'false') {
        productsObject = await Product.findAll({include: [Promotion]});
        return response.status(200).send(productsObject);
    } else if (option) {
        let optionLimit;
        switch (option) {
            case 'createdAt':
                optionLimit = 5;
                break;
            case 'updatedAt':
                optionLimit = 6;
                break;
            case 'sales':
                optionLimit = 3;
                break;
        }

        productsObject = await Product.findAll({order: [[option, 'DESC']], limit: optionLimit});
        const mediaArray = await getMediaArrayFromProducts(productsObject);

        await Product.findAll().then((listOfCountedItems) => {
            for (let element of listOfCountedItems) {
                countOfSales += element.sales;
            }
        });

        return response.status(200).send({countOfSales, mediaArray, productsObject});
    }

    console.log('json - ' + request.query.sortingMethod);
    let productType = await getProductTypeFrom(request.query.where), sortingMethod = request.query.sortingMethod,
        page = request.query.page;

    const limit = 1, offset = (page * limit) - limit;

    tableObject = await sortProducts(sortingMethod, limit, offset, productType);
    let objectsCount = tableObject.count;
    productsObject = tableObject.rows;

    const mediaObjects = await getMediaArrayFromProducts(productsObject);

    return response.status(200).send({objectsCount, productsObject, mediaObjects});
});

productsRouter.get('/getProduct/:productNameOrId', async(request,
                                                     response) => {
    const product = await getProductBy(request.params.productNameOrId);
    let mediaArray = [], productType, promotion;
    try {
        if (product) {
            productType = await getProductTypeFrom(product.productTypeId);

            let pathArray = await Media.findAll({where: {productId: product.id}});
            mediaArray = await readFiles(pathArray);
            promotion = await Promotion.findOne({where: {productId: product.id}})
        }
    } catch (e) {
        console.log('ошибка при чтении - ' + e);
    }
    return (product) ? response.status(200).send({...product, mediaArray, productType: productType.name, promotion})
        : response.status(400).json(printMessage('Товара с таким именем не существует'));
})

productsRouter.get('/getPromotions', async(request,
                                           response) => {
    const promotionsObject = await Promotion.findAll();

    return response.status(200).send(promotionsObject);
});

productsRouter.get('/getPromotion', async(request,
                                                         response) => {
    let promotionName = request.query.value;
    console.log(promotionName);
    const promotionObject = await Promotion.findOne({where: {title: promotionName}});

    return (promotionObject) ? response.status(200).send(promotionObject) :
        response.status(400).json(printMessage('Данной акции не существует'));
})

productsRouter.get('/getPromoCodes', async (request,
    response) => {
    const promoCodesObject = await PromoCode.findAll();

    return response.status(200).send(promoCodesObject);
});

productsRouter.get('/getPromoCode/:promo', async(request,
                                                 response) => {
    let promo = request.params.promo;
    const promoObject = await PromoCode.findOne({where: {code: promo}});

    return (promoObject) ? response.status(200).send(promoObject) :
        response.status(400).json(printMessage('Данного промо-кода не существует'));
});

productsRouter.put('/updateProduct/:productId',
    upload.fields([{name: 'photosArray', maxCount: 3}]),
    async(request,
          response) => {
        const productId = request.params.productId;
        let {productName, description, price} = request.body;

        const errorMessage = isExists(productName, description, price, productPhotosArray);
        if (errorMessage !== '') {
            productPhotosArray = [];
            return response.status(400).json(printMessage(errorMessage));
        } else {
            let savedMediaArray = await Media.findAll({where: {productId}});
            for (let element of savedMediaArray) {
                fileSystem.unlinkSync('C:/Users/User/mediaContent/' + element.path);
            }

            await Media.destroy({where: {productId}});
            await Product.update({name: capitalizeWord(productName), ...request.body}, {where: {id: productId}, returning: true, plain: true});
            for (let i = 0; i < productPhotosArray.length; i++) {
                await Media.create({path: productPhotosArray[i], productId});
            }
            const updatablePromotion = await Promotion.findOne({where: {productId}});
            if (updatablePromotion) {
                const newTitle = '-' + updatablePromotion.size + ' % на товар ' + productName;
                await Promotion.update({title: newTitle}, {where: {productId}});
            }

            productPhotosArray = [];
            return response.status(200).json(printMessage('Ok'));
        }
    }
);

productsRouter.delete('/deleteProduct/:productName', async(request,
                                                           response) => {
    let productName = request.params.productName;
    await Product.destroy({where: {name: productName}});

    return response.status(200).json(printMessage('Ok'));
});

productsRouter.delete('/deletePromotion', async(request,
                                                response) => {
    let promotionTitle = request.query.value;
    await Promotion.destroy({where: {title: promotionTitle}});

    return response.status(200).json(printMessage('Ok'));
});

productsRouter.delete('/deletePromoCode/:promo', async(request,
                                                response) => {
    let promoCode = request.params.promo;
    await PromoCode.destroy({where: {code: promoCode}}).then((result) => {
        console.log(JSON.stringify(result));
    })

    return response.status(200).json(printMessage('Ok'));
});

module.exports = productsRouter;