const { TYPE } = require('./constants/index')

/**
 * pg实例
 * @typedef {import('pg').Client} Client
 */

/**
 * 自定义类型
 * @typedef {object} ICustomType
 * @property {string} key   类型名称
 * @property {import('./logic/BaseType').IBaseTypeNamespace} type  类型的pg类型
 * @property {any}    value 值
 */

/**
 * 可用类型
 * @typedef {keyof TYPE} ITypes
 */

/**
 * 表
 * @typedef {
 *  'ActivityLog' | 'Article' | 'ArticleTag' | 'Category' | 'Comment' | 'Follower' | 'Likes' | 'Media' | 'Role' | 'Route' | 'Setting' | 'Tag' | 'Users' | 'View'
 * } ITable
 */
