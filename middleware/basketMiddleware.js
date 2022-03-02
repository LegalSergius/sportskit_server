const {getMediaArrayFromProducts} = require("./productsMiddleware");
const {Product, BasketItem, Promotion} = require("../model/model");

async function getFullInformationOfBasket(basketId) {
    const basketItems = await BasketItem.findAll({where: {basketId}});
    let mediaArray = [], productsArray = [];

    for (let element of basketItems) {
        let productId = element.productId;
        const product = await Product.findOne({where: {id: productId}, include: [Promotion]});
        if (product) {
            productsArray.push(product);
        } else {
            await BasketItem.destroy({where: {productId}});
        }
    }
    console.log(JSON.stringify(productsArray));

    mediaArray = await getMediaArrayFromProducts(productsArray);

    return {mediaArray, productsArray};
}

module.exports = {getFullInformationOfBasket}