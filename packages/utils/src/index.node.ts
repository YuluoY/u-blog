// 服务端功能
export * from './core'
export * from './mock'

// 基础工具导入
import * as core from './core'
import * as mock from './mock'

// 服务端默认导出
export default {
  core,
  mock
}
