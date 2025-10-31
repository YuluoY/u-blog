import type { Request } from 'express'

// 使用模块增强（Module Augmentation）扩展 Express 的 Request 类型
declare module 'express' {
    export interface Request {
        image?: { 
            buffer: Buffer
            type: string
            quality?: number
        }
    }
}

// 导出扩展后的类型，方便其他地方使用
export interface SharpImageRequest extends Request {
    image?: { 
        buffer: Buffer
        type: string
        quality?: number
    }
}
