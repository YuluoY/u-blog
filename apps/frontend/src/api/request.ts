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

/** 上传文件响应数据 */
export interface UploadResult {
  url: string
  mediaId: number
  name: string
  size: number
  mimeType: string
}

/**
 * 上传文件到服务端（FormData multipart）
 * @param file 原始 File 对象
 * @returns 上传结果（url、mediaId 等）
 */
export async function uploadFile(file: File): Promise<UploadResult> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await instance.post<BackendResponse<UploadResult>>('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  })
  const payload = res.data
  if (payload.code !== 0) {
    throw new Error(payload.message || '上传失败')
  }
  return payload.data
}

/**
 * 删除媒体文件
 * @param mediaId 媒体记录 ID
 */
export async function deleteMedia(mediaId: number): Promise<void> {
  const res = await instance.delete<BackendResponse<unknown>>('/media', { data: { id: mediaId } })
  const payload = res.data
  if (payload.code !== 0) {
    throw new Error(payload.message || '删除失败')
  }
}

/**
 * 记录文章浏览（后端自动去重 IP）
 * @param articleId 文章 ID
 * @returns 更新后的 viewCount
 */
export async function recordArticleView(articleId: number): Promise<{ viewCount: number }> {
  const res = await instance.post<BackendResponse<{ viewCount: number }>>('/article-view', { articleId })
  const payload = res.data
  if (payload.code !== 0) {
    throw new Error(payload.message || '记录浏览失败')
  }
  return payload.data
}

/**
 * 记录站点访问（后端按 IP 每日去重）
 * @returns 今日 UV
 */
export async function recordSiteVisit(): Promise<{ todayUv: number }> {
  const res = await instance.post<BackendResponse<{ todayUv: number }>>('/site-visit')
  const payload = res.data
  if (payload.code !== 0) {
    throw new Error(payload.message || '记录访问失败')
  }
  return payload.data
}

export default instance
