const Router = require('express');
const {getFullInformationOfBasket} = require("../../middleware/basketMiddleware");
const {printMessage} = require("../../middleware/userMiddleware");
const {BasketItem} = require("../../model/model");

let basketRouter = new Router();

basketRouter.post('/addBasketItem',
    async(request,
          response) => {
    const productId = request.body.productId, basketId = Number(request.body.basketId);
    const basketItem = await BasketItem.findOne({where: {productId}});
    let itemsCount;

    if (basketItem) {
        itemsCount = await BasketItem.count();
        return response.status(400)
            .json(printMessage('Этот товар уже есть в Вашей корзине.\nКоличество продуктов в корзине: ' +
                itemsCount + '.\nОткрыть корзину для просмотра?'));
    }

    await BasketItem.create({productId, basketId}).catch((error) => {
        console.log(`error basket - ${productId}, ${request.body.basketId}`);
    });
    itemsCount = await BasketItem.count();

    return response.status(200).json({count: itemsCount});
});

basketRouter.get('/getBasketById/:basketId',
    async(request,
          response) => {
    const basketId = request.params.basketId;
    const {productsArray, mediaArray} = await getFullInformationOfBasket(basketId);

    response.status(200).send({productsArray, mediaArray});
});

basketRouter.delete('/deleteBasketItemById',
    async(request,
          response) => {
    const deletableItemId = request.query.productId, basketId = request.query.basketId;
    await BasketItem.destroy({where: {productId: deletableItemId}});
    console.log(deletableItemId + ', ' + basketId);

    const {productsArray, mediaArray} = await getFullInformationOfBasket(basketId);
    return response.status(200).json({productsArray, mediaArray});
})
module.exports = basketRouter;