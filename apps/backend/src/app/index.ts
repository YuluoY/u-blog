import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import YAML from 'yaml'
import type { SignOptions } from 'jsonwebtoken'
import type { ConfigObject } from 'svg-captcha'
import type { Options } from 'swagger-jsdoc'
import type { ConfigurationOptions } from 'i18n'
import type { CookieOptions } from 'express'
import type { DataSourceOptions } from 'typeorm'
import dotenv from 'dotenv'
dotenv.config()

const __dirname = dirname(fileURLToPath(import.meta.url))

export interface PluginsConfig {
	cookie: CookieOptions
	jwt: SignOptions
	rt: SignOptions
	captcha: ConfigObject
	swagger: Options
	i18n: ConfigurationOptions
}

export interface IAppConfig {
	port: number
	staticPath: string
	emailExpired: number
	plugins: PluginsConfig
	database: DataSourceOptions
}
const appCfg: IAppConfig = {
	/**
	 * 服务器端口号
	 */
	port: 3000,
	/**
	 * 静态资源路径
	 */
	staticPath: resolve(__dirname, '../..', 'public'),
	/**
	 * 邮箱验证码有效期，5分钟
	 */
	emailExpired: 1000 * 60 * 5,


	/**
	 * 数据库配置
	 */
	database: {
		type: 'postgres',
		url: process.env.DATABASE_URL,
		host: process.env.DB_HOST,
		port: parseInt(process.env.DB_PORT || '5432', 10),
		username: process.env.DB_USERNAME,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_DATABASE,
		
		poolSize: 8, // 根据你的服务器配置调整
		extra: {
			max: 20,           // 最大连接数
			min: 5,            // 最小连接数
			idleTimeoutMillis: 30000,     // 30秒空闲超时
			connectionTimeoutMillis: 5000, // 5秒连接超时
		},
		synchronize: process.env.NODE_ENV === 'development',  
		// dropSchema: process.env.NODE_ENV === 'development',
		schema: 'public',
		logging: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : false,
		entities: [resolve(__dirname, '../module/schema/**/*.ts')]
	},

	/**
	 * 插件配置
	 */
	plugins: {
		/**
		 * cookie
		 */
		cookie: {
			httpOnly: true,
			path: '/',
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 1000 * 60 * 60 * 24 * 7 // 7天
		},

		/**
		 * access token
		 */
		jwt: {
			expiresIn: '99999d',
			algorithm: 'HS256',
			issuer: 'ucc'
		},

		/**
		 * refresh token
		 */
		rt: {
			expiresIn: '7d',
			algorithm: 'HS256'
		},

		/**
		 * 验证码生成插件配置
		 */
		captcha: {
			width: 150,
			height: 50,
			fontSize: 50,
			noise: 5,
			color: true,
			background: '#cc9966'
		},
		/**
		 * 接口文档生成配置
		 */
		swagger: {
			url: '/api-docs',
			swaggerDefinition: {
				openapi: '3.0.0',
				info: {
					title: 'API 文档',
					version: '1.0.0',
					description: '自动生成的 API 文档'
				}
			},
			apis: [resolve(__dirname, '../router/**/*.doc.ts')] // API 注释所在的文件路径
		},

		/**
		 * 国际化配置
		 */
		i18n: {
			extension: '.yml',
			parser: YAML,
			objectNotation: true,
			locales: ['en', 'zh'], // 支持的语言
			directory: resolve(__dirname, '../locales'), // 存放翻译文件的目录
			defaultLocale: 'zh', // 默认语言
			queryParameter: 'lang', // 可以通过URL查询参数来设置语言，例如 ?lang=zh
			autoReload: true, // 自动重新加载翻译文件
			updateFiles: false, // 禁止自动更新翻译文件
			syncFiles: true, // 在所有语言文件中同步缺少的消息
			cookie: 'ucc-blog-lang' // 存储语言的 cookie 名称
		}
	}
}

export default appCfg
