const sequelize = require('../configurations/dataBaseTrigger');
const DataTypes = require('sequelize');

const User = sequelize.define('user', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    emailOrPhone: {type: DataTypes.STRING, unique: true},
    password: {type: DataTypes.STRING},
    name: {type: DataTypes.STRING},
    surname: {type: DataTypes.STRING}
    }, {
        schema: 'strongs_schema'
});

const Role = sequelize.define('role', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    role: {type: DataTypes.STRING, unique: true}
    }, {
        schema: 'strongs_schema'
});

const ProductType = sequelize.define('product_type', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    name: {type: DataTypes.STRING}
    }, {
        schema: 'strongs_schema'
});

const Product = sequelize.define('product', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    name: {type: DataTypes.STRING},
    description: {type: DataTypes.STRING},
    price: {type: DataTypes.INTEGER},
    sales: {type: DataTypes.INTEGER}
    }, {
        schema: 'strongs_schema'
});

const Media = sequelize.define('media', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    path: {type: DataTypes.STRING}
    }, {
        schema: 'strongs_schema'
});

const Promotion = sequelize.define('promotion', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    title: {type: DataTypes.STRING},
    size: {type: DataTypes.INTEGER}
    }, {
    schema: 'strongs_schema'
});

const PromoCode = sequelize.define('promo_code', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    code: {type: DataTypes.STRING},
    size: {type: DataTypes.INTEGER}
}, {
    schema: 'strongs_schema'
})

const Basket = sequelize.define('basket', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    }, {
    schema: 'strongs_schema'
});

const BasketItem = sequelize.define('basket_item', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    productId: {type: DataTypes.INTEGER}
}, {
    schema: 'strongs_schema'
})

User.belongsTo(Role);
User.hasOne(Basket);

Basket.hasMany(BasketItem);

ProductType.hasMany(Product);
ProductType.hasMany(PromoCode);

Product.hasOne(Promotion, {onDelete: 'cascade'});
Product.hasMany(Media, {onDelete: 'cascade'});

module.exports = {User, Role, ProductType, Product, Media,
    Promotion, PromoCode, Basket, BasketItem};