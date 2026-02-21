import type { Request } from 'express'
import type { Repository } from 'typeorm'
import type { UserRole } from '@u-blog/model'

/** JWT 解码后附着在 req.user 上的载荷 */
export interface JwtUser {
  id: number
  username: string
  role: UserRole
}

// 使用模块增强（Module Augmentation）扩展 Express 的 Request 类型
declare module 'express' {
  export interface Request {
    model?: Repository<any>
    /** JWT 验证通过后附着的用户信息（未登录时为 undefined） */
    user?: JwtUser
    image?: {
      buffer: Buffer
      type: string
      quality?: number
    }
  }
}
