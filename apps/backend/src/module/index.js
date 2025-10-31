const { Global } = require('../constants')
const load = require('./load')
const PgTools = require('./logic/PgTools')

module.exports = {
	/**
	 * 加载数据库
	 * @param {import('express').Application} app
	 */
	install(app) {
		const database = new PgTools()
		database
			.createPool()
			.pool.query('SELECT 1')
			.then(async (_) => {
				const modules = await load(database.pool, { logger: false })
				app.locals[Global.DATABASE] = database
				app.locals[Global.MODELS] = modules
				console.log(`Connected to database as ${database.user}`)
			})
			.catch(console.error)
	}
}
