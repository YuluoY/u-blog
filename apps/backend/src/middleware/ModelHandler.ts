import type { Request, Response, NextFunction } from 'express'
import { toModelName, getDataSource } from '@/utils'

/**
 * 允许通过通用 REST 接口访问的模型白名单
 * - PUBLIC_QUERY: 允许匿名查询
 * - AUTH_REQUIRED: 查询需要登录（users/setting/user_setting 等敏感表）
 * 未在白名单中的模型一律拒绝访问
 */
const PUBLIC_QUERY_MODELS = new Set([
	'article', 'comment', 'category', 'tag',
	'media', 'view', 'like', 'friend_link', 'page_block',
	'subscriber',
])
const AUTH_REQUIRED_MODELS = new Set([
	'users', 'setting', 'user_setting', 'activity_log',
	'follower', 'role', 'permission', 'route',
	'xiaohui_conversation',
])
/** 全量白名单：两者合集 */
const ALL_ALLOWED_MODELS = new Set([...PUBLIC_QUERY_MODELS, ...AUTH_REQUIRED_MODELS])

/**
 * 处理 model 表实例中间件 —— 增加白名单校验，防止越权访问任意数据库表
 */
export const ModelHandler = (req: Request, res: Response, next: NextFunction) => {
	const { model } = req.params
	// 白名单校验：只允许已注册的模型名
	if (!ALL_ALLOWED_MODELS.has(model)) {
		res.status(403).json({ code: 403, data: null, message: `模型 "${model}" 不允许访问` })
		return
	}
	// 需要认证的模型：匿名请求直接拒绝
	if (AUTH_REQUIRED_MODELS.has(model) && !req.user) {
		res.status(401).json({ code: 401, data: null, message: '请先登录' })
		return
	}
	const database = getDataSource(req)
	req.model = database.getRepository(toModelName(model))
	next()
}

export { PUBLIC_QUERY_MODELS, AUTH_REQUIRED_MODELS }
