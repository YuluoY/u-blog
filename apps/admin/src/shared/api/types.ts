/**
 * 后端统一响应结构
 */
export interface BackendResponse<T = unknown> {
  code: number
  data: T
  message: string
  timestamp?: number
}

export interface LoginRes {
  id: number
  username: string
  role?: string
  namec?: string
}
