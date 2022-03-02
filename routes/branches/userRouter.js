const Router = require('express');

let userRouter = new Router(), userCount = 0;

userRouter.post('/enter', async(request,
                           response) => {
    if (!request.body.key) {
        return;
    }

    userCount++;
    console.log('enter - ' + userCount);
});
userRouter.post('/exit', async(request,
                           response) => {
    userCount--;
    console.log('exit - ' + userCount);
});
userRouter.get('/getCount', async(request,
                          response) => {
    return response.status(200).json({count: userCount});
})

module.exports = userRouter;