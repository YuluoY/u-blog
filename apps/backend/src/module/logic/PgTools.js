/**
 * 数据库工具类
 *
 * @typedef {import('pg').Client} Client
 * @typedef {import('pg').Pool} Pool
 * @typedef {import('pg').PoolConfig} PoolConfig
 */

/**
 * @typedef {object} PgToolsOptions
 * @property {string} user
 * @property {string} password
 * @property {string} database
 * @property {string} host
 * @property {number} port
 */

class PgTools {
	_pg = null

	/**
	 * 连接池
	 * @type {Pool}
	 */
	_pool = null

	/**
	 * 连接实例
	 * @type {Client}
	 */
	_client = null

	user = 'postgres' // 用户名
	password = 'admin' // 密码
	database = 'postgres' // 数据库名称
	host = 'localhost' // 主机地址
	port = 5432 // 端口号

	/**
	 * 构造函数
	 * @param {PgToolsOptions} opts
	 */
	constructor(opts = {}) {
		this.user = opts.user || this.user
		this.password = opts.password || this.password
		this.database = opts.database || this.database
		this.host = opts.host || this.host
		this.port = opts.port || this.port
	}

	/**
	 * 建立连接池
	 * @method
	 * @param  {PoolConfig}    poolOpts    连接池配置
	 * @return {PgTools}
	 */
	createPool(poolOpts = {}) {
		this._pg = require('pg')
		/**
		 * 连接池配置说明（常用项）
		 * @type {import('pg').PoolOptions}
		 */
		const opts = {
			user: this.user,
			host: this.host,
			database: this.database,
			password: this.password,
			port: this.port,
			// 最大并发连接数
			max: 20,
			// 连接空闲超时（毫秒）。到期未使用会回收，避免长时间占用。
			idleTimeoutMillis: 30000,
			// 启用 TCP 层保活，减少 NAT/LB 对空闲连接的断开。
			keepAlive: true,
			// 单条连接最大存活时长（秒）。到期重建，降低长期连接异常累积风险。
			maxLifetimeSeconds: 3600,
			// 单连接最大使用次数。达到后重建，进一步提升稳定性。
			maxUses: 10000,
			// 其余配置从外部传入，覆盖以上默认值。
			...poolOpts
		}
		this.pool = new this._pg.Pool(opts)
		// setInterval(() => {
		// 	this.pool.query('SELECT 1').catch((err) => console.error('Keep-alive query failed', err))
		// }, 5000) // 每100ms执行一次，保持连接
		return this
	}

	/**
	 * 连接数据库（不自动释放）
	 * @method
	 * @return {Promise<{ client: Client, release: Function }>}
	 */
	async connect() {
		const client = await this.pool.connect()
		this.client = client
		const release = () => client.release()
		return { client, release }
	}

	/**
	 * 重新连接数据库
	 * @method
	 * @return {Promise}
	 */
	async reconnect() {
		await this.pool.end()
		this.createPool()
		return this.connect()
	}

	/**
	 * 事务操作管理
	 * @method
	 * @param     {Function}    fn    数据库操作函数
	 * @param     {boolean}     auto  是否自动提交
	 * @return    {Promise<{ client: Client, commit: Function }>}
	 */
	async withTransaction(fn, auto = true) {
		const client = await this.pool.connect()
		try {
			await client.query('BEGIN')
			const commit = () => client.query('COMMIT')
			if (auto) {
				await fn(client)
				await commit()
			} else {
				await fn(client, commit)
			}
		} catch (err) {
			try {
				await client.query('ROLLBACK')
			} catch (_) {
				console.log(_)
			}
			throw err
		} finally {
			client.release()
		}
	}

	/**
	 * 提供带 client 的上下文，自动负责释放
	 * @template T
	 * @param {(client: Client) => Promise<T>} fn
	 * @returns {Promise<T>}
	 */
	async withClient(fn) {
		const client = await this.pool.connect()
		try {
			return await fn(client)
		} finally {
			client.release()
		}
	}

	get pg() {
		return this._pg
	}

	get pool() {
		return this._pool
	}

	set pool(pool) {
		this._pool = pool
	}

	get client() {
		return this._client
	}

	set client(client) {
		this._client = client
	}
}

module.exports = PgTools
