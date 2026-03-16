import type { Request, Response, NextFunction } from 'express'
import type { UserRole } from '@u-blog/model'
import { CUserRole } from '@u-blog/model'

/**
 * 角色权重：数值越大权限越高
 */
const ROLE_WEIGHT: Record<UserRole, number> = {
	[CUserRole.USER]: 1,
	[CUserRole.ADMIN]: 2,
	[CUserRole.SUPER_ADMIN]: 3,
}

/** 判定用户角色是否 ≥ admin */
function isAdmin(role?: string): boolean {
	return (ROLE_WEIGHT[role as UserRole] ?? 0) >= ROLE_WEIGHT[CUserRole.ADMIN]
}

/* ---------- 模型分类白名单 ---------- */

/**
 * 行级所有权模型：写操作时，普通用户只能操作自己的数据（通过 userId 字段校验）
 * admin+ 可操作任意记录
 */
const OWNERSHIP_MODELS = new Set([
	'article', 'category', 'tag', 'media', 'friend_link',
])

/**
 * 用户隔离模型：所有角色只能操作自己的数据，admin 也不例外
 * user_setting 存储用户级别隐私配置（如 API key）
 */
const USER_ISOLATED_MODELS = new Set([
	'user_setting',
])

/**
 * 管理员专属写入模型：仅 admin+ 可执行写操作（add/update/del）
 * 普通用户不可写
 */
const ADMIN_WRITE_MODELS = new Set([
	'setting', 'role', 'permission', 'route', 'page_block',
])

/**
 * Users 表特殊规则单独处理（不在上述分类中）
 */

/* ---------- 敏感字段保护 ---------- */

/**
 * Users 表中禁止普通用户自行修改的字段
 * role 仅 super_admin 可修改，password/token/rthash 等不允许通过 REST 接口修改
 */
const USERS_PROTECTED_FIELDS = new Set([
	'role', 'password', 'token', 'rthash', 'isActive',
	'failLoginCount', 'lockoutExpiresAt', 'lastLoginAt',
])

/**
 * Users 表响应中需过滤掉的敏感字段
 */
export const USERS_SENSITIVE_FIELDS = new Set([
	'password', 'token', 'rthash', 'failLoginCount',
	'lockoutExpiresAt', 'lastLoginAt', 'isActive',
])

/**
 * 从对象中移除敏感字段（浅层，直接 delete）
 */
export function stripSensitiveFields(obj: Record<string, any>, fields: Set<string>): void {
	for (const key of fields) {
		delete obj[key]
	}
}

/* ---------- 辅助函数：查询记录所有者 ---------- */

/**
 * 通过 repo 查询目标记录的 userId（仅读取 userId 列，最小化查询）
 * 若模型无 userId 列或记录不存在，返回 null
 */
async function getRecordOwnerId(repo: any, id: number): Promise<number | null> {
	const meta = repo.metadata
	const hasUserId = meta.columns.some((c: { propertyName: string }) => c.propertyName === 'userId')
	if (!hasUserId) return null
	const record = await repo.findOne({ where: { id }, select: ['id', 'userId'] })
	return record?.userId ?? null
}

/* ---------- 中间件 ---------- */

/**
 * REST 写操作守卫中间件
 *
 * 权限模型：
 * 1. USER_ISOLATED（user_setting）：强制 userId = 自身，任何角色都只能操作自己
 * 2. ADMIN_WRITE（setting/role/permission/route/page_block）：仅 admin+ 可写
 * 3. OWNERSHIP（article/category/tag/media/friend_link）：user 只能操作自己的，admin+ 无限制
 * 4. users：只能改自己，role 字段仅 super_admin 可改
 * 5. 其他模型（comment/view/like/activity_log/follower）：维持当前行为（登录即可）
 */
export const restWriteGuard = async (
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	const model = req.params?.model
	const user = req.user
	const method = req.method.toUpperCase()

	// 仅拦截写操作（PUT/DELETE/POST with add path）
	// query 路由不经过此中间件，无需过滤
	if (!model || !user) {
		next()
		return
	}

	// ---------- 1. 用户隔离模型（user_setting）----------
	if (USER_ISOLATED_MODELS.has(model)) {
		if (method === 'POST' && req.path.endsWith('/add')) {
			// 新增：强制 userId = 自身
			req.body.userId = user.id
		} else if (method === 'PUT') {
			// 修改：校验目标记录归属
			const id = Number(req.body?.id)
			if (!id) { res.status(400).json({ code: 400, data: null, message: 'id 必填' }); return }
			const ownerId = await getRecordOwnerId(req.model, id)
			if (ownerId !== user.id) {
				res.status(403).json({ code: 403, data: null, message: '只能操作自己的设置' })
				return
			}
		} else if (method === 'DELETE') {
			const id = Number(req.body?.id ?? req.query?.id)
			if (!id) { res.status(400).json({ code: 400, data: null, message: 'id 必填' }); return }
			const ownerId = await getRecordOwnerId(req.model, id)
			if (ownerId !== user.id) {
				res.status(403).json({ code: 403, data: null, message: '只能删除自己的设置' })
				return
			}
		}
		next()
		return
	}

	// ---------- 2. 管理员专属写入模型 ----------
	if (ADMIN_WRITE_MODELS.has(model)) {
		if (!isAdmin(user.role)) {
			res.status(403).json({ code: 403, data: null, message: '权限不足，仅管理员可操作' })
			return
		}
		next()
		return
	}

	// ---------- 3. Users 表特殊规则 ----------
	if (model === 'users') {
		if (method === 'PUT') {
			const targetId = Number(req.body?.id)
			// 普通用户只能改自己的资料
			if (!isAdmin(user.role) && targetId !== user.id) {
				res.status(403).json({ code: 403, data: null, message: '只能修改自己的资料' })
				return
			}
			// 清除受保护字段：非 super_admin 不可修改 role 等关键字段
			if (user.role !== CUserRole.SUPER_ADMIN) {
				for (const field of USERS_PROTECTED_FIELDS) {
					delete req.body[field]
				}
			}
		} else if (method === 'DELETE') {
			// 删除用户仅 super_admin
			if (user.role !== CUserRole.SUPER_ADMIN) {
				res.status(403).json({ code: 403, data: null, message: '仅超级管理员可删除用户' })
				return
			}
		} else if (method === 'POST' && req.path.endsWith('/add')) {
			// 新增用户仅 admin+
			if (!isAdmin(user.role)) {
				res.status(403).json({ code: 403, data: null, message: '权限不足' })
				return
			}
		}
		next()
		return
	}

	// ---------- 4. 行级所有权模型 ----------
	if (OWNERSHIP_MODELS.has(model)) {
		// 新增时自动注入 userId（所有角色），确保数据库 NOT NULL 约束不会被违反
		if (method === 'POST' && req.path.endsWith('/add')) {
			req.body.userId = user.id
		}
		// admin+ 无需所有权校验
		if (isAdmin(user.role)) {
			next()
			return
		}
		// 普通用户：校验所有权
		if (method === 'PUT') {
			const id = Number(req.body?.id)
			if (!id) { res.status(400).json({ code: 400, data: null, message: 'id 必填' }); return }
			const ownerId = await getRecordOwnerId(req.model, id)
			if (ownerId !== null && ownerId !== user.id) {
				res.status(403).json({ code: 403, data: null, message: '只能修改自己的内容' })
				return
			}
		} else if (method === 'DELETE') {
			const id = Number(req.body?.id ?? req.query?.id)
			if (!id) { res.status(400).json({ code: 400, data: null, message: 'id 必填' }); return }
			const ownerId = await getRecordOwnerId(req.model, id)
			if (ownerId !== null && ownerId !== user.id) {
				res.status(403).json({ code: 403, data: null, message: '只能删除自己的内容' })
				return
			}
		}
	}

	// ---------- 5. 其他模型（comment/view/like/activity_log/follower）----------
	// 维持当前行为：登录即可操作
	next()
}

/**
 * user_setting 查询守卫：强制 where.userId = 自身，实现数据隔离
 * 仅在 query 路由中使用
 */
export const userSettingQueryGuard = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const model = req.params?.model
	if (model === 'user_setting' && req.user) {
		// 强制注入 userId 条件，用户只能查自己的设置
		if (!req.body) req.body = {}
		if (!req.body.where) req.body.where = {}
		req.body.where.userId = req.user.id
	}
	next()
}
