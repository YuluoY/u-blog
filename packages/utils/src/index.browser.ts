export * from './core'
export * from './dom'
// mock 模块仅用于开发/测试，不在生产浏览器端导出，避免 @faker-js/faker (~5MB) 被打入主 chunk
// 需要时请直接 import { generRandomMd } from '@u-blog/utils/mock'
export * from './request'
export * from './storage'
export * from './types'

export * from 'lodash-es'