import type { Request, Response, NextFunction } from 'express'
import type { EntityTarget, ObjectLiteral } from 'typeorm'
import { getDataSource } from '@/utils'
import { appendFileSync } from 'node:fs'

// ---- 实体类引用 ----
// 使用实体 class 而非字符串查找 repository，避免 TypeORM metadata 匹配问题
import { ActivityLog } from '@/module/schema/ActivityLog'
import { Announcement } from '@/module/schema/Announcement'
import { Article } from '@/module/schema/Article'
import { Category } from '@/module/schema/Category'
import { Comment } from '@/module/schema/Comment'
import { Follower } from '@/module/schema/Follower'
import { FriendLink } from '@/module/schema/FriendLink'
import { Likes } from '@/module/schema/Likes'
import { Media } from '@/module/schema/Media'
import { PageBlock } from '@/module/schema/PageBlock'
import { Permission } from '@/module/schema/Permission'
import { Role } from '@/module/schema/Role'
import { Route } from '@/module/schema/Route'
import { Setting } from '@/module/schema/Setting'
import { Subscriber } from '@/module/schema/Subscriber'
import { Tag } from '@/module/schema/Tag'
import { UserSetting } from '@/module/schema/UserSetting'
import { Users } from '@/module/schema/Users'
import { View } from '@/module/schema/View'
import { XiaohuiConversation } from '@/module/schema/XiaohuiConversation'
import { Moment } from '@/module/schema/Moment'

/**
 * URL 路径名 → 实体 class 的映射表
 * key 与路由 `/rest/:model` 中的 model 一一对应
 */
const ENTITY_MAP: Record<string, EntityTarget<ObjectLiteral>> = {
	article: Article,
	comment: Comment,
	category: Category,
	tag: Tag,
	media: Media,
	view: View,
	like: Likes,
	friend_link: FriendLink,
	page_block: PageBlock,
	subscriber: Subscriber,
	route: Route,
	announcement: Announcement,
	users: Users,
	setting: Setting,
	user_setting: UserSetting,
	activity_log: ActivityLog,
	follower: Follower,
	role: Role,
	permission: Permission,
	xiaohui_conversation: XiaohuiConversation,
	moment: Moment,
}

/**
 * 允许通过通用 REST 接口访问的模型白名单
 * - PUBLIC_QUERY: 允许匿名查询
 * - AUTH_REQUIRED: 查询需要登录（users/setting/user_setting 等敏感表）
 * 未在白名单中的模型一律拒绝访问
 */
const PUBLIC_QUERY_MODELS = new Set([
	'article', 'comment', 'category', 'tag',
	'media', 'view', 'like', 'friend_link', 'page_block',
	'subscriber', 'route', 'announcement', 'moment',
])
const AUTH_REQUIRED_MODELS = new Set([
	'users', 'setting', 'user_setting', 'activity_log',
	'follower', 'role', 'permission',
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
	const entity = ENTITY_MAP[model]
	// DEBUG: 跟踪 entity metadata 查找问题（写入文件，绕过 stdout 管道）
	const debugMsg = `[ModelHandler] ${new Date().toISOString()} model=${model}, entity=${(entity as any)?.name}, isInitialized=${database.isInitialized}, entityMetadatas=${database.entityMetadatas?.length}\n`
	try { appendFileSync('/tmp/model-handler.log', debugMsg) } catch {}
	process.stdout.write(debugMsg)
	try {
		req.model = database.getRepository(entity)
	} catch (e: any) {
		console.error(`[ModelHandler] getRepository FAILED:`, e.message)
		console.error(`[ModelHandler] entityMetadatasMap keys:`, [...(database as any).entityMetadatasMap?.keys?.() ?? []].map((k: any) => typeof k === 'function' ? k.name : k))
		throw e
	}
	next()
}

export { PUBLIC_QUERY_MODELS, AUTH_REQUIRED_MODELS }
