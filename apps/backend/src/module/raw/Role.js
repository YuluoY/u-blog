const { Tables } = require('../../constants')
const { USER_ROLE, CUSTOM_TYPE } = require('../constants')
const BaseSchema = require('../logic/BaseSchema')
const BaseType = require('../logic/BaseType')
const SqlTools = require('../logic/SqlTools')
const USql = new SqlTools()

class Role extends BaseSchema {
	static tableName = Tables.ROLE

	/**
	 * @param {Client} client
	 */
	constructor(client = null) {
		super(client)
	}

	async initCustomType() {}
	async initTriggerFunc() {}
	async initFunc() {}
	async createSchema(force = false) {
		// 创建表
		await this.client.query(`
			${force ? `DROP TABLE IF EXISTS ${Role.tableName} CASCADE` : ''}
			CREATE TABLE IF NOT EXISTS ${Role.tableName} (
				id     				SMALLSERIAL     	PRIMARY KEY,
				name   				${CUSTOM_TYPE.USER_ROLE} 	UNIQUE NOT NULL,
				desc 					VARCHAR(255) 		NOT NULL,
				"createdAt"   TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
				"updatedAt"  	TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
				"deletedAt" 	TIMESTAMP       DEFAULT NULL
			)
		`)

		// 添加表字段备注
		await this.client.query(`
			COMMENT ON COLUMN ${Role.tableName}.id 							IS '主键';
			COMMENT ON COLUMN ${Role.tableName}.name 						IS '角色名称';
			COMMENT ON COLUMN ${Role.tableName}.desc 						IS '角色描述';
			COMMENT ON COLUMN ${Role.tableName}."createdAt" 		IS '创建时间';
			COMMENT ON COLUMN ${Role.tableName}."updatedAt" 		IS '更新时间';
			COMMENT ON COLUMN ${Role.tableName}."deletedAt" 		IS '删除时间';
			COMMENT ON TABLE 	${Role.tableName} 								IS '角色表';
		`)
	}

	async exec() {
		USql.setTable(Role.tableName)
		this.initData()
	}

	/**
	 * 初始化表数据
	 * @returns {Promise<void>}
	 */
	async initData() {
		await this.client.query(
			USql.insert([
				{ name: USER_ROLE.ADMIN, desc: '管理员' },
				{ name: USER_ROLE.USER, desc: '普通用户' },
				{ name: USER_ROLE.GUEST, desc: '游客' }
			]).toSqlString()
		)
	}
}

module.exports = Role

