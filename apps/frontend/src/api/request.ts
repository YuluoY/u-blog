import axios from 'axios'

const instance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

export interface BackendResponse<T = unknown> {
  code: number
  data: T
  message: string
  timestamp: number
}

/**
 * 调用后端 REST 通用查询接口
 * @param model 表名，如 article、users、category、tag、comment
 * @param body 查询参数 { where?, take?, skip?, order? }
 */
export async function restQuery<T = unknown>(
  model: string,
  body: { where?: Record<string, unknown>; take?: number; skip?: number; order?: Record<string, 'ASC' | 'DESC'>; relations?: string[] } = {}
): Promise<T> {
  const res = await instance.post<BackendResponse<T>>(`/rest/${model}/query`, body)
  const payload = res.data
  if (payload.code !== 0) {
    throw new Error(payload.message || '请求失败')
  }
  return payload.data as T
}

/**
 * 调用后端 REST 通用添加接口
 */
export async function restAdd<T = unknown>(
  model: string,
  body: Record<string, unknown> = {}
): Promise<T> {
  const res = await instance.post<BackendResponse<T>>(`/rest/${model}/add`, body)
  const payload = res.data
  if (payload.code !== 0) {
    throw new Error(payload.message || '请求失败')
  }
  return payload.data as T
}

/**
 * 调用后端 REST 通用更新接口（body 需含 id）
 */
export async function restUpdate<T = unknown>(
  model: string,
  id: number,
  body: Record<string, unknown> = {}
): Promise<T> {
  const res = await instance.put<BackendResponse<T>>(`/rest/${model}/update`, { id, ...body })
  const payload = res.data
  if (payload.code !== 0) {
    throw new Error(payload.message || '请求失败')
  }
  return payload.data as T
}

/**
 * 调用后端 REST 通用删除接口
 */
export async function restDel(model: string, id: number): Promise<void> {
  const res = await instance.delete<BackendResponse<unknown>>(`/rest/${model}/del`, { data: { id } })
  const payload = res.data
  if (payload.code !== 0) {
    throw new Error(payload.message || '请求失败')
  }
}

export default instance
