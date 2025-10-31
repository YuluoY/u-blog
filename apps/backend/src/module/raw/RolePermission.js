/**
 * 角色权限关联表
 */

const { Tables } = require('../../constants')
const BaseSchema = require('../logic/BaseSchema')

class RolePermission extends BaseSchema {
	static tableName = Tables.ROLE_PERMISSION

	/**
	 * @param {Client} client
	 */
	constructor(client = null) {
		super(client)
	}

	async createSchema(force = false) {
		// 创建表
		await this.client.query(`
			${force ? `DROP TABLE IF EXISTS ${RolePermission.tableName} CASCADE` : ''}
			CREATE TABLE IF NOT EXISTS ${RolePermission.tableName} (
				id     				SMALLSERIAL     	PRIMARY KEY,
				"roleName"   	VARCHAR(50) 		NOT NULL,
				"permissionId" SMALLINT 				NOT NULL,
				"createdAt"   TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
				"updatedAt"  	TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
				"deletedAt" 	TIMESTAMP       DEFAULT NULL,
				FOREIGN KEY ("roleName") REFERENCES ${Tables.ROLE} (name) ON DELETE CASCADE,
				FOREIGN KEY ("permissionId") REFERENCES ${Tables.PERMISSION} (id) ON DELETE CASCADE,
				UNIQUE("roleName", "permissionId")
			)
		`)

		// 添加表字段备注
		await this.client.query(`
			COMMENT ON COLUMN ${RolePermission.tableName}.id 							IS '主键';
			COMMENT ON COLUMN ${RolePermission.tableName}."roleName" 			IS '角色名称';
			COMMENT ON COLUMN ${RolePermission.tableName}."permissionId" 	IS '权限ID';
			COMMENT ON COLUMN ${RolePermission.tableName}."createdAt" 		IS '创建时间';
			COMMENT ON COLUMN ${RolePermission.tableName}."updatedAt" 		IS '更新时间';
			COMMENT ON COLUMN ${RolePermission.tableName}."deletedAt" 		IS '删除时间';
			COMMENT ON TABLE 	${RolePermission.tableName} 								IS '角色权限关联表';
		`)
	}
}

module.exports = RolePermission

