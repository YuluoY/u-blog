import type { Request, Response, NextFunction } from 'express'
import type { UserRole } from '@u-blog/model'
import { CUserRole } from '@u-blog/model'

/**
 * 角色权重映射：数值越大权限越高。
 * super_admin > admin > user
 */
const ROLE_WEIGHT: Record<UserRole, number> = {
	[CUserRole.USER]: 1,
	[CUserRole.ADMIN]: 2,
	[CUserRole.SUPER_ADMIN]: 3,
}

/**
 * 生成角色守卫中间件：要求当前用户角色权重 ≥ 指定最低角色。
 * 需先经过 AuthGuard + requireAuth，确保 req.user 存在。
 *
 * @param minRole 允许访问的最低角色，如 'admin' 表示 admin 和 super_admin 都可访问
 * @example
 * router.put('/settings', requireAuth, requireRole('admin'), handler)
 */
export const requireRole = (minRole: UserRole) =>
	(req: Request, res: Response, next: NextFunction): void => {
		const userRole = req.user?.role
		if (!userRole || (ROLE_WEIGHT[userRole] ?? 0) < (ROLE_WEIGHT[minRole] ?? 0)) {
			res.status(403).json({ code: 403, data: null, message: '权限不足' })
			return
		}
		next()
	}
