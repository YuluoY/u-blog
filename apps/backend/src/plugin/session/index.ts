import type { Application } from 'express'
import session from 'express-session'

export const Session = {
	install(app: Application) {
		app.use(
			session({
				secret: process.env.CAPTCHA_SECRET,
				resave: false,
				saveUninitialized: true,
				cookie: { secure: false }
			})
		)
	}
}