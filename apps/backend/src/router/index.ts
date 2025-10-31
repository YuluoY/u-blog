import { ModelHandler, SqlHandler } from '@/middleware'
// import commonRouter from './common'
// import restRouter from './rest'
import webRouter from './web'
import backRouter from './back'
import type { Application } from 'express'

export const Router = {
	/**
	 * 加载数据库
	 * @param {import('express').Application} app
	 */
	install(app: Application) {
		// app.use('/', commonRouter)
		// app.use('/rest/:model', ModelHandler, SqlHandler(), restRouter)
		// app.use('/web/:model', ModelHandler, SqlHandler(), webRouter)
		// app.use('/back/:model', ModelHandler, SqlHandler(), backRouter)
	}
}
