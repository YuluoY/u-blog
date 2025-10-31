/**
 * 作者表 - 用户和文章的多对多关联表
 */

const { Tables } = require('../../constants')
const BaseSchema = require('../logic/BaseSchema')

class Author extends BaseSchema {
	static tableName = Tables.AUTHOR

	/**
	 * @type {Client}
	 */
	constructor(client = null) {
		super(client)
	}

	/**
	 * 创建作者表
	 * @returns {Promise<void>}
	 */
	async createSchema(force = false) {
		await this.client.query(`
    ${force ? `DROP TABLE IF EXISTS ${Author.tableName} CASCADE` : ''}
		CREATE TABLE IF NOT EXISTS ${Author.tableName} (
			id 						      SERIAL 				    PRIMARY KEY,
      "userId"            INTEGER           NOT NULL,
      "articleId"         INTEGER           NOT NULL,
      "order"      				SMALLINT          DEFAULT 0,
      "contribution"      TEXT              DEFAULT NULL,
      "createdAt"         TIMESTAMP         DEFAULT CURRENT_TIMESTAMP,
      "updatedAt"         TIMESTAMP         DEFAULT CURRENT_TIMESTAMP,
      "deletedAt"         TIMESTAMP         DEFAULT NULL,
      FOREIGN KEY ("userId") REFERENCES ${Tables.USERS}("id") ON DELETE CASCADE,
      FOREIGN KEY ("articleId") REFERENCES ${Tables.ARTICLE}("id") ON DELETE CASCADE,
      UNIQUE("userId", "articleId")
		)
		`)

		// 添加字段备注
		await this.client.query(`
      COMMENT ON COLUMN ${Author.tableName}.id                  IS '主键';
      COMMENT ON COLUMN ${Author.tableName}."userId"            IS '用户ID';
      COMMENT ON COLUMN ${Author.tableName}."articleId"         IS '文章ID';
      COMMENT ON COLUMN ${Author.tableName}."order"             IS '排序';
      COMMENT ON COLUMN ${Author.tableName}.contribution        IS '贡献描述';
      COMMENT ON COLUMN ${Author.tableName}."createdAt"         IS '创建时间';
      COMMENT ON COLUMN ${Author.tableName}."updatedAt"         IS '更新时间';
      COMMENT ON COLUMN ${Author.tableName}."deletedAt"         IS '删除时间';
      COMMENT ON TABLE ${Author.tableName}                      IS '作者表';
    `)

		// 添加更新时间触发器
		// await BaseSchema.createTimeTrigger(Author.name, 'updatedAt', client)
	}
}

module.exports = Author

