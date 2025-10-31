/**
 * 文章表
 */

const { Tables } = require('../../constants')
const { TYPE, CUSTOM_TYPE, ARTICLE_STATUS } = require('../constants')
const BaseSchema = require('../logic/BaseSchema')

class Article extends BaseSchema {
	static tableName = Tables.ARTICLE

	/**
	 * @type {Client}
	 */
	constructor(client = null) {
		super(client)
	}

	/**
	 * 创建文章表
	 * @returns {Promise<void>}
	 */
	async createSchema(force = false) {
		await this.client.query(`
    ${force ? `DROP TABLE IF EXISTS ${Article.tableName} CASCADE` : ''}
		CREATE TABLE IF NOT EXISTS ${Article.tableName} (
			id 						      SERIAL 				    PRIMARY KEY,
      "userId"            INTEGER,
      "categoryId"        SMALLINT,
      title               VARCHAR(100)      UNIQUE NOT NULL,
      content             TEXT              NOT NULL,
      desc                TEXT              DEFAULT NULL,
      cover               VARCHAR(255)      DEFAULT NULL,
      status              ${CUSTOM_TYPE.ARTICLE_STATUS}    DEFAULT ${ARTICLE_STATUS.DRAFT},
      "isPrivate"         BOOLEAN           DEFAULT FALSE,
      "isTop"             BOOLEAN           DEFAULT FALSE,
      protect             VARCHAR(50)       DEFAULT NULL,
      "commentCount"      INTEGER           DEFAULT 0,
      "likeCount"         INTEGER           DEFAULT 0,
      "viewCount"         INTEGER           DEFAULT 0,
      "publishedAt"       TIMESTAMP         DEFAULT NULL,
      "createdAt"         TIMESTAMP         DEFAULT CURRENT_TIMESTAMP,
      "updatedAt"         TIMESTAMP         DEFAULT CURRENT_TIMESTAMP,
      "deletedAt"         TIMESTAMP         DEFAULT NULL,
      FOREIGN KEY ("userId") REFERENCES ${Tables.USERS}("id") ON DELETE CASCADE,
      FOREIGN KEY ("categoryId") REFERENCES ${Tables.CATEGORY}("id") ON DELETE CASCADE
		)
		`)

		// 添加字段备注
		await this.client.query(`
      COMMENT ON COLUMN ${Article.tableName}.id                  IS '主键';
      COMMENT ON COLUMN ${Article.tableName}."userId"            IS '创建人ID';
      COMMENT ON COLUMN ${Article.tableName}."categoryId"        IS '分类ID';
      COMMENT ON COLUMN ${Article.tableName}.title               IS '标题';
      COMMENT ON COLUMN ${Article.tableName}.content             IS '内容';
      COMMENT ON COLUMN ${Article.tableName}.desc                IS '描述';
      COMMENT ON COLUMN ${Article.tableName}.cover               IS '封面';
      COMMENT ON COLUMN ${Article.tableName}.status              IS '状态';
      COMMENT ON COLUMN ${Article.tableName}."isPrivate"         IS '是否私密';
      COMMENT ON COLUMN ${Article.tableName}."isTop"             IS '是否置顶';
      COMMENT ON COLUMN ${Article.tableName}.protect             IS '密码保护';
      COMMENT ON COLUMN ${Article.tableName}."commentCount"      IS '评论数';
      COMMENT ON COLUMN ${Article.tableName}."likeCount"         IS '点赞数';
      COMMENT ON COLUMN ${Article.tableName}."viewCount"         IS '浏览数';
      COMMENT ON COLUMN ${Article.tableName}."publishedAt"       IS '发布时间';
      COMMENT ON COLUMN ${Article.tableName}."createdAt"         IS '创建时间';
      COMMENT ON COLUMN ${Article.tableName}."updatedAt"         IS '更新时间';
      COMMENT ON COLUMN ${Article.tableName}."deletedAt"         IS '删除时间';
      COMMENT ON TABLE ${Article.tableName}                      IS '文章表';
    `)

		// 添加更新时间触发器
		// await BaseSchema.createTimeTrigger(Article.name, 'updatedAt', client)
	}
}

module.exports = Article

