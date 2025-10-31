/**
 * 路由表
 */

const { Tables } = require('../../constants')
const BaseSchema = require('../logic/BaseSchema')
class Route extends BaseSchema {
	static tableName = Tables.ROUTE
	/**
	 * @param {Client} client
	 */
	constructor(client) {
		super(client)
	}

	async createSchema(force = false) {
		// 创建表
		await this.client.query(`
      ${force ? `DROP TABLE IF EXISTS ${Route.tableName} CASCADE` : ''}
      CREATE TABLE IF NOT EXISTS ${Route.tableName} (
        id                SMALLSERIAL         PRIMARY KEY,
        title             VARCHAR(50)        DEFAULT NULL,
        name              VARCHAR(50)        NOT NULL UNIQUE,
        path              VARCHAR(255)        NOT NULL UNIQUE,
        component         VARCHAR(255)        DEFAULT NULL,
        redirect          VARCHAR(100)        DEFAULT NULL,
        icon              VARCHAR(100)        DEFAULT NULL,
        "isKeepAlive"     BOOLEAN             DEFAULT FALSE,
        "isAffix"         BOOLEAN             DEFAULT FALSE,
        "isExact"         BOOLEAN             DEFAULT FALSE,
        "isProtected"     BOOLEAN             DEFAULT FALSE,
        "isHero"          BOOLEAN             DEFAULT FALSE,
        "isLeftSide"      BOOLEAN             DEFAULT FALSE,
        "isRightSide"      BOOLEAN             DEFAULT FALSE,
        pid               SMALLINT,
        "createdAt"       TIMESTAMP           DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"       TIMESTAMP           DEFAULT CURRENT_TIMESTAMP,
        "deletedAt"       TIMESTAMP           DEFAULT NULL,
        FOREIGN KEY (pid) REFERENCES ${Route.tableName}(id) ON DELETE RESTRICT
      )
    `)

		// 添加字段备注
		await this.client.query(`
      COMMENT ON COLUMN ${Route.tableName}.id            IS    '主键';
      COMMENT ON COLUMN ${Route.tableName}.title         IS    '路由标题';
      COMMENT ON COLUMN ${Route.tableName}.name          IS    '路由名称';
      COMMENT ON COLUMN ${Route.tableName}.path          IS    '路由路径';
      COMMENT ON COLUMN ${Route.tableName}.component     IS    '组件路径';
      COMMENT ON COLUMN ${Route.tableName}.redirect      IS    '重定向路径';
      COMMENT ON COLUMN ${Route.tableName}.icon          IS    '图标';
      COMMENT ON COLUMN ${Route.tableName}."isKeepAlive" IS    '是否缓存';
      COMMENT ON COLUMN ${Route.tableName}."isAffix"     IS    '是否固定';
      COMMENT ON COLUMN ${Route.tableName}."isExact"     IS    '是否精确匹配';
      COMMENT ON COLUMN ${Route.tableName}."isProtected" IS    '是否需要鉴权';
      COMMENT ON COLUMN ${Route.tableName}."isHero"      IS    '是否显示Hero封面';
      COMMENT ON COLUMN ${Route.tableName}."isLeftSide"  IS    '是否显示左侧信息';
      COMMENT ON COLUMN ${Route.tableName}."isRightSide" IS    '是否显示右侧信息';
      COMMENT ON COLUMN ${Route.tableName}.pid            IS    '父级路由ID';
      COMMENT ON COLUMN ${Route.tableName}."deletedAt"   IS    '删除时间';
      COMMENT ON COLUMN ${Route.tableName}."createdAt"   IS    '创建时间';
      COMMENT ON COLUMN ${Route.tableName}."updatedAt"   IS    '更新时间';
      COMMENT ON TABLE  ${Route.tableName}               IS    '路由表';
    `)
	}
}

module.exports = Route

