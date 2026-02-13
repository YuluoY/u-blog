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
  body: { where?: Record<string, unknown>; take?: number; skip?: number; order?: Record<string, 'ASC' | 'DESC'> } = {}
): Promise<T> {
  const res = await instance.post<BackendResponse<T>>(`/rest/${model}/query`, body)
  const payload = res.data
  if (payload.code !== 0) {
    throw new Error(payload.message || '请求失败')
  }
  return payload.data as T
}

export default instance
