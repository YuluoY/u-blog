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

app.listen(appCfg.port, () => {
	console.log(`Ucc-blog server listening on http://localhost:${appCfg.port}`)
})