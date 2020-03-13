const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const mongoDB = require('./mongodb/db');
const router = require('./router/index.js');
const Send = require('./res/genSend')
const jwt = require('jsonwebtoken');
const config = require('config-lite')(__dirname);
const app = new Koa();

app.context.db = mongoDB.db;
app.context.successSend = Send.successSend;
app.context.failSend = Send.failSend;
app.use(bodyParser());

app.use(async (ctx, next) => {
	let noLogin = ['/api/admin/login', '/api/admin/logout'];
    const { token } = ctx.header;
	const { path } = ctx.request;
	let loginUser = token && jwt.decode(token);
	if(!noLogin.includes(path)){
		if(loginUser){
			app.context.loginUser = loginUser;
			await next();
		}else {
			ctx.body = ctx.failSend(-401);
			console.log(401);
		}
	}
});

// 加载路由中间件
app.use(router.routes()).use(router.allowedMethods());

app.use(ctx => {
    ctx.status = 404;
    ctx.body = {
        status: 404,
        msg: '接口不存在'
    }
});

app.on('error', (err, ctx) => {
	console.log('app error: ',err)
    ctx.status = 500;
    ctx.body = {
        status: -500,
        msg: '服务器错误'
    }
});


app.listen(config.port);

console.log(`[node-koa] start-quick is starting at port ${config.port}`);