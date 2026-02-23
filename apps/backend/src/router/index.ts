import { ModelHandler } from '@/middleware'
import commonRouter from './common'
import restRouter from './rest'
import analyticsRouter from './analytics'
import xiaohuiRouter from './xiaohui'
import type { Application } from 'express'

export const Router = {
	/**
	 * 加载数据库
	 * @param {import('express').Application} app
	 */
	install(app: Application) {
		app.use('/', commonRouter)
		app.use('/xiaohui', xiaohuiRouter)
		app.use('/activity', analyticsRouter)
		app.use('/rest/:model', ModelHandler, restRouter)
	}
}
