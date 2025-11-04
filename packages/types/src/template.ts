/**
 * 成功响应模板 返回值类型
 * @param   data
 * @param   message
 */
export declare interface SuccessReturn<T = any> {
  code: 0
  data: T
  message: string
  timestamp: number
}

/**
 * 失败响应模板 返回值类型
 * @param   message
 * @param   moreMsg
 */
export declare interface FailReturn {
  code: 1
  data: null
  message: string
  timestamp: number
}

/**
 * 分页响应模板 返回值类型
 */
export declare interface PageReturn<T = any> extends SuccessReturn<T> {
  page: number
  limit: number
  total: number
}

/**
 * 控制层请求返回
 */
export declare type ControllerReturn<T = any> = Promise<SuccessReturn<T> | FailReturn | PageReturn<T>>