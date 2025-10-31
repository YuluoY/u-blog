/**
 * 用户表
 */
const { Tables } = require('../../constants')
const { CUSTOM_TYPE, USER_ROLE } = require('../constants')
const BaseSchema = require('../logic/BaseSchema')
const SqlTools = require('../logic/SqlTools')
const USql = new SqlTools()
class Users extends BaseSchema {
	static tableName = Tables.USERS

	/**
	 * @param {Client} client
	 */
	constructor(client) {
		super(client)
	}

	async createSchema(force = false) {
		// 创建表
		await this.client.query(`
		${force ? `DROP TABLE IF EXISTS ${Users.tableName} CASCADE` : ''}
    CREATE TABLE IF NOT EXISTS ${Users.tableName} (
    	id 						      SERIAL 						PRIMARY KEY,
    	username 		        VARCHAR(100) 			UNIQUE NOT NULL,
    	password 			      VARCHAR(50)				NOT NULL,
    	email 				      VARCHAR(100) 			UNIQUE DEFAULT NULL,
    	namec 				      VARCHAR(100)			DEFAULT NULL,
      avatar 				      VARCHAR(255)			DEFAULT NULL,
      bio                 TEXT              DEFAULT NULL,
      role                ${CUSTOM_TYPE.USER_ROLE}         DEFAULT 'guest',
      location            VARCHAR(255)      DEFAULT NULL,
      ip                  VARCHAR(50)       DEFAULT NULL,
      website             JSONB      				DEFAULT NULL,
      socials             JSONB             DEFAULT NULL,
      "isActive"          BOOLEAN           DEFAULT true,
      "isVerified"        BOOLEAN           DEFAULT false,
      token               VARCHAR(255)      DEFAULT NULL,
			rthash							VARCHAR(100)			DEFAULT NULL,
      "failLoginCount"    INTEGER           DEFAULT 0,
      "lockoutExpiresAt"  TIMESTAMP         DEFAULT NULL,
      "lastLoginAt" 	    TIMESTAMP 				DEFAULT CURRENT_TIMESTAMP,
    	"createdAt" 		    TIMESTAMP 				DEFAULT CURRENT_TIMESTAMP,
    	"updatedAt" 		    TIMESTAMP 				DEFAULT CURRENT_TIMESTAMP,
    	"deletedAt"	 	      TIMESTAMP 				DEFAULT NULL,
      FOREIGN KEY (role) REFERENCES ${Tables.ROLE} (name)
    )
    `)

		// 添加表字段备注
		await this.client.query(`
      COMMENT ON COLUMN ${Users.tableName}.id                  IS '用户ID';
      COMMENT ON COLUMN ${Users.tableName}.username            IS '用户名';
      COMMENT ON COLUMN ${Users.tableName}.password            IS '密码';
      COMMENT ON COLUMN ${Users.tableName}.email               IS '邮箱';
      COMMENT ON COLUMN ${Users.tableName}.namec               IS '昵称';
      COMMENT ON COLUMN ${Users.tableName}.avatar              IS '头像';
      COMMENT ON COLUMN ${Users.tableName}.bio                 IS '个人简介';
      COMMENT ON COLUMN ${Users.tableName}.role                IS '角色';
      COMMENT ON COLUMN ${Users.tableName}.location            IS '所在地';
      COMMENT ON COLUMN ${Users.tableName}.ip                  IS '登录IP';
      COMMENT ON COLUMN ${Users.tableName}.website             IS '个人网站';
      COMMENT ON COLUMN ${Users.tableName}.socials             IS '社交账号';
      COMMENT ON COLUMN ${Users.tableName}."isActive"          IS '账号是否激活';
      COMMENT ON COLUMN ${Users.tableName}."isVerified"        IS '邮箱是否验证';
      COMMENT ON COLUMN ${Users.tableName}.token               IS '签发访问令牌';
			COMMENT ON COLUMN ${Users.tableName}.rthash       			 IS '刷新令牌的随机字符串密钥';
      COMMENT ON COLUMN ${Users.tableName}."failLoginCount"    IS '登录失败次数';
      COMMENT ON COLUMN ${Users.tableName}."lockoutExpiresAt"  IS '失败锁定过期时间';
      COMMENT ON COLUMN ${Users.tableName}."lastLoginAt"       IS '最后登录时间';
      COMMENT ON COLUMN ${Users.tableName}."createdAt"         IS '创建时间';
      COMMENT ON COLUMN ${Users.tableName}."updatedAt"         IS '更新时间';
      COMMENT ON COLUMN ${Users.tableName}."deletedAt"         IS '删除时间';
      COMMENT ON TABLE ${Users.tableName}                      IS '用户表';
    `)
	}

	async exec() {
		USql.setTable(Users.tableName)
		// this.initData()
	}

	async initData() {
		const data = [
			[
				USER_ROLE.ADMIN,
				'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJ1c2VybmFtZSI6ImFkbWluIiwiaWF0IjoxNzU4MDc2OTE5LCJleHAiOjEwMzk3OTkwNTE5LCJpc3MiOiJ1Y2MifQ.PVuP1FFWsZEZrb89yDDJJBMhuCOpzwaG0VzKkyDmhw0'
			],
			[USER_ROLE.USER, 'test-user'],
			[USER_ROLE.GUEST, 'test-guest']
		].map((item) => ({
			username: item[0],
			password: '123456',
			email: `test-${item[0]}-568055454@qq.com`,
			namec: 'Eric Hu',
			avatar: 'https://q1.qlogo.cn/g?b=qq&nk=568055454&s=640',
			bio: 'Hello World',
			role: item[0],
			location: 'Beijing, China',
			ip: '127.0.0.1',
			website: 'https://github.com/eric-hu-568055454',
			socials: [
				{ type: 'Github', url: 'https://github.com/YuluoY', icon: 'github' },
				{ type: 'QQ', url: 'https://im.qq.com/', icon: 'qq' },
				{ type: 'WeChat', url: 'https://weixin.qq.com/', icon: 'wechat' }
			],
			isActive: true,
			isVerified: true,
			token: item[1]
		}))
		const sql = USql.insert(data).toSqlString()
		await this.client.query(sql)
	}
}

module.exports = Users

