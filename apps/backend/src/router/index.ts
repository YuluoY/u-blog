import { ModelHandler } from '@/middleware'
import commonRouter from './common'
import restRouter from './rest'
import analyticsRouter from './analytics'
import xiaohuiRouter from './xiaohui'
import systemRouter from './system'
import exportRouter from './export'
import subscribeRouter from './subscribe'
import seoRouter from './seo'
import type { Application } from 'express'

export const Router = {
	/**
	 * 加载数据库
	 * @param {import('express').Application} app
	 */
	install(app: Application) {
		app.use('/', commonRouter)
		app.use('/seo', seoRouter)
		app.use('/xiaohui', xiaohuiRouter)
		app.use('/activity', analyticsRouter)
		app.use('/system', systemRouter)
		app.use('/export', exportRouter)
		app.use('/subscribe', subscribeRouter)
		app.use('/rest/:model', ModelHandler, restRouter)
	}
}
