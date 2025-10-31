/**
 * 权限表
 */

const { Tables } = require('../../constants')
const BaseSchema = require('../logic/BaseSchema')

class Permission extends BaseSchema {
	static tableName = Tables.PERMISSION

	/**
	 * @param {Client} client
	 */
	constructor(client = null) {
		super(client)
	}

	async createSchema(force = false) {
		// 创建表
		await this.client.query(`
			${force ? `DROP TABLE IF EXISTS ${Permission.tableName} CASCADE` : ''}
			CREATE TABLE IF NOT EXISTS ${Permission.tableName} (
				id     				SMALLSERIAL   PRIMARY KEY,
				name   				VARCHAR(100) 	UNIQUE NOT NULL,
				code   				VARCHAR(100) 	UNIQUE NOT NULL,
				desc 					VARCHAR(255) 	DEFAULT NULL,
				type   				VARCHAR(50)  	DEFAULT 'button', -- button, menu, api
				resource 			VARCHAR(100) 	DEFAULT NULL, -- 资源标识
				action   			VARCHAR(50)  	DEFAULT NULL, -- create, read, update, delete
				"createdAt"   TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
				"updatedAt"  	TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
				"deletedAt" 	TIMESTAMP       DEFAULT NULL
			)
		`)

		// 添加表字段备注
		await this.client.query(`
			COMMENT ON COLUMN ${Permission.tableName}.id 							IS '主键';
			COMMENT ON COLUMN ${Permission.tableName}.name 						IS '权限名称';
			COMMENT ON COLUMN ${Permission.tableName}.code 						IS '权限编码';
			COMMENT ON COLUMN ${Permission.tableName}.desc 						IS '权限描述';
			COMMENT ON COLUMN ${Permission.tableName}.type 						IS '权限类型';
			COMMENT ON COLUMN ${Permission.tableName}.resource 				IS '资源标识';
			COMMENT ON COLUMN ${Permission.tableName}.action 					IS '操作类型';
			COMMENT ON COLUMN ${Permission.tableName}."createdAt" 		IS '创建时间';
			COMMENT ON COLUMN ${Permission.tableName}."updatedAt" 		IS '更新时间';
			COMMENT ON COLUMN ${Permission.tableName}."deletedAt" 		IS '删除时间';
			COMMENT ON TABLE 	${Permission.tableName} 								IS '权限表';
		`)
	}

	async initData() {
		// 定义表级别的权限规则
		const tableVals = Object.values(Tables)
		// 为每个表生成CRUD权限
		for (const table of tableVals) {
			const permissions = [
				{
					name: `${table}_read`,
					code: `${table}:read`,
					type: 'menu',
					resource: table,
					action: 'read'
				},
				{
					name: `${table}_create`,
					code: `${table}:create`,
					type: 'button',
					resource: table,
					action: 'create'
				},
				{
					name: `${table}_update`,
					code: `${table}:update`,
					type: 'button',
					resource: table,
					action: 'update'
				},
				{
					name: `${table}删除`,
					code: `${table}:delete`,
					type: 'button',
					resource: table,
					action: 'delete'
				}
			]

			// 插入权限数据
			for (const perm of permissions) {
				await this.client.query(`
					INSERT INTO ${Permission.tableName} (name, code, desc, type, resource, action)
					VALUES ('${perm.name}', '${perm.code}', '${perm.desc}', '${perm.type}', '${perm.resource}', '${perm.action}')
					ON CONFLICT (code) DO NOTHING
				`)
			}
		}

		// 添加特殊权限
		const specialPermissions = [
			{ name: '系统设置', code: 'system:config', type: 'menu', resource: 'system', action: 'read' },
			{ name: '仪表板', code: 'dashboard:view', type: 'menu', resource: 'dashboard', action: 'read' },
			{ name: '数据导出', code: 'data:export', type: 'button', resource: 'data', action: 'export' },
			{ name: '数据导入', code: 'data:import', type: 'button', resource: 'data', action: 'import' }
		]

		for (const perm of specialPermissions) {
			await this.client.query(`
				INSERT INTO ${Permission.tableName} (name, code, desc, type, resource, action)
				VALUES ('${perm.name}', '${perm.code}', '${perm.desc}', '${perm.type}', '${perm.resource}', '${perm.action}')
				ON CONFLICT (code) DO NOTHING
			`)
		}
	}
}

module.exports = Permission

