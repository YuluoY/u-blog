import type { Request } from 'express'
import type { Repository } from 'typeorm'

// 使用模块增强（Module Augmentation）扩展 Express 的 Request 类型
declare module 'express' {
  export interface Request {
    model?: Repository<any>
    image?: { 
      buffer: Buffer
      type: string
      quality?: number
    }
  }
}
