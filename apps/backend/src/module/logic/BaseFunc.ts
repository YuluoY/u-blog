import { cloneDeep } from '@u-blog/utils'
import type { Client } from 'pg'

/**
 * The BaseFunc options
 * @typedef {Object} IBaseFuncOptions
 */

/**
 * The Namespace of BaseFunc class
 * @typedef {keyof BaseFunc.Namespace} IBaseFuncNamespace
 */

class BaseFunc {
	/**
	 * The BaseFunc class's namespace
	 * @constant
	 * @static
	 */
	static Namespace = Object.freeze({
		AUTO_UPDATE_TIME: 'auto_update_time'
	})

	/**
	 * @param client
	 * @param opts
	 */
	constructor(client: Client = null, opts: IBaseFuncOptions = {}) {
		if (!client) throw new Error('BaseFunc: client is required')
		this.client = client
		Object.assign(this, cloneDeep(opts))
		this._rawOpts = opts
	}

	/**
	 * 创建一个sql函数
	 * @param   {keyof BaseFunc.Namespace}   	funcName    sql函数名称
	 * @param   {string}              				funcBody    sql函数体
	 */
	async createFunc(funcName, funcBody = '') {
		if (await this.isExistFunc(this.client, funcName)) return
		await this.client.query(`
			CREATE OR REPLACE FUNCTION ${funcName}()
			RETURNS TRIGGER AS $$
			BEGIN
				${funcBody}
				RETURN NEW;
			END;
			$$ LANGUAGE plpgsql;
		`)
	}

	/**
	 * 是否存在函数
	 * @param   {keyof BaseFunc.Namespace}   funcName    sql函数名称
	 * @returns {Promise<boolean>}
	 */
	async isExistFunc(funcName) {
		const res = await this.client.query(`
			SELECT EXISTS (
				SELECT 1
				FROM pg_proc
				JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
				WHERE pg_proc.proname = '${funcName}'
			);
		`)
		return res.rows[0].exists
	}
}

module.exports = BaseFunc
