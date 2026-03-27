import 'reflect-metadata'
import express from 'express'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import appCfg from '@/app'
import database from '@/module'
import { initRedis } from '@/service/cache'

import { Router } from '@/router'
import { I18n } from '@/plugin/i18n'
import { Session } from '@/plugin/session'
import { RequestInterceptor } from '@/middleware'
import { ResponseInterceptor } from '@/middleware'
import { Swagger } from '@/plugin/swagger'

const app = express()

// 信任反代（Nginx / Cloudflare），使 req.ip 正确返回客户端真实 IP
app.set('trust proxy', true)

// HTTP 响应 gzip 压缩：文章正文等大 JSON 传输体积可降低 60-80%
// threshold 1KB — 过小的响应不值得压缩
app.use(compression({
	threshold: 1024,
	filter: (req, res) => {
		const accept = String(req.headers.accept || '')
		if (accept.includes('text/event-stream')) return false
		return compression.filter(req, res)
	},
}))

// 安全头（helmet）
app.use(helmet({
	contentSecurityPolicy: false, // SPA 应用需要较宽松的 CSP，视需要后续收紧
	crossOriginEmbedderPolicy: false,
}))

// CORS 配置
app.use(cors({
	origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://localhost:5174'],
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
}))

// 全局速率限制：每 IP 15 分钟内最多 300 次请求
// 开发环境下跳过 localhost 来源（Vite dev proxy 全部走 127.0.0.1，会共享计数器）
const isDev = process.env.NODE_ENV !== 'production'
app.use(rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 300,
	standardHeaders: true,
	legacyHeaders: false,
	message: { code: 429, data: null, message: '请求过于频繁，请稍后再试' },
	validate: { trustProxy: false },
	skip: (req) => {
		if (!isDev) return false
		const ip = req.ip || req.socket?.remoteAddress || ''
		// 开发时跳过本机请求，避免 dev proxy 共享 IP 触发限流
		return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1'
	},
}))

// session
Session.install(app)

// 配置国际化
app.use(I18n)

// 加载数据库
database.install(app, {
	database: appCfg.database
})

// 初始化 Redis 缓存（连接失败不阻塞应用启动）
initRedis()

// 解析 application/json（限制 50MB，支持大文章内容）
app.use(express.json({ limit: '50mb' }))

// 解析 application/x-www-form-urlencoded（限制 50MB）
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

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