const Router = require('express');
const authRouter = require('./branches/authRouter');
const productsRouter = require('./branches/productsRouter');
const basketRouter = require('./branches/basketRouter');
const userRouter = require('./branches/userRouter');

let appRouter = new Router();
appRouter.use('/auth', authRouter);
appRouter.use('/products', productsRouter);
appRouter.use('/baskets', basketRouter);
appRouter.use('/user', userRouter);

module.exports = appRouter;