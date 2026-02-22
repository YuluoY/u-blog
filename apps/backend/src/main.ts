import express from 'express'
import cookieParser from 'cookie-parser'
import appCfg from '@/app'
import database from '@/module'

import { Router } from '@/router'
import { I18n } from '@/plugin/i18n'
import { Session } from '@/plugin/session'
import { RequestInterceptor } from '@/middleware'
import { ResponseInterceptor } from '@/middleware'
import { Swagger } from '@/plugin/swagger'

const app = express()
// session
Session.install(app)

// 配置国际化
app.use(I18n)

// 加载数据库
database.install(app, {
	database: appCfg.database
})

// 解析 application/json 类型的请求体 express 4.0+
app.use(express.json())

// 解析 application/x-www-form-urlencoded 类型的请求体 express 4.0+
app.use(express.urlencoded({ extended: true }))

// 解析cookie
app.use(cookieParser())

// 配置请求拦截器
app.use(RequestInterceptor)

// 配置响应拦截器
app.use(ResponseInterceptor)

// 注册路由
Router.install(app)

// 配置静态目录
app.use(express.static(appCfg.staticPath))

// 配置API接口生成文档
Swagger.install(app)

// app.get('/', (req, res) => {
// 	res.send('Hello World123')
// })

const server = app.listen(appCfg.port, () => {
	console.log(`Ucc-blog server listening on http://localhost:${appCfg.port}`)
})

// 捕获端口占用错误，避免 nodemon 重启时出现未处理异常
server.on('error', (err: NodeJS.ErrnoException) => {
	if (err.code === 'EADDRINUSE') {
		console.error(`❌ 端口 ${appCfg.port} 已被占用，请执行: lsof -ti:${appCfg.port} | xargs kill -9`)
		process.exit(1)
	} else {
		throw err
	}
})

// nodemon 重启时优雅关闭：先停止接受新连接，再退出进程
// 确保端口在下次启动前完全释放
const gracefulShutdown = (signal: string) => {
	console.log(`\n收到 ${signal}，正在优雅关闭服务器...`)
	server.close(() => {
		console.log('服务器已关闭')
		process.exit(0)
	})
	// 强制兜底：5s 后仍未关闭则强制退出
	setTimeout(() => process.exit(1), 5000).unref()
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))