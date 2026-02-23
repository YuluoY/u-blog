import type { Application } from 'express'
import session from 'express-session'

export const Session = {
	install(app: Application) {
		const secret = process.env.CAPTCHA_SECRET
		if (!secret) {
			console.warn('⚠️ CAPTCHA_SECRET 未设置，使用默认密钥（生产环境必须配置）')
		}
		app.use(
			session({
				secret: secret || 'u-blog-session-fallback-dev-only',
				resave: false,
				saveUninitialized: false,
				cookie: {
					secure: process.env.NODE_ENV === 'production',
					httpOnly: true,
					sameSite: 'lax',
					maxAge: 1000 * 60 * 30, // 30分钟
				}
			})
		)
	}
}