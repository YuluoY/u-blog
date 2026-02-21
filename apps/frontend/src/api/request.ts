import axios from 'axios'
import type { IUserLogin, IUserRegisterDto, IUserLoginDto } from '@u-blog/model'

/** 内存中保存的 access token（不持久化，刷新页面后通过 /refresh 恢复） */
let accessToken: string | null = null

/** 获取当前 access token */
export function getAccessToken(): string | null {
  return accessToken
}

/** 设置 access token（登录/刷新成功后调用） */
export function setAccessToken(token: string | null) {
  accessToken = token
}

const instance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
})

/* ---------- 请求拦截器：自动附带 Authorization 头 ---------- */
instance.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

/* ---------- 响应拦截器：401 时清除 token ---------- */
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      accessToken = null
    }
    return Promise.reject(error)
  }
)

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

/* ---------- 认证相关 ---------- */

/**
 * 用户登录
 * @param data 用户名/邮箱 + 密码
 * @returns 用户信息 + access token（rt 由后端 set-cookie 自动设置）
 */
export async function loginApi(data: IUserLoginDto): Promise<IUserLogin> {
  const res = await instance.post<BackendResponse<IUserLogin>>('/login', data)
  const payload = res.data
  if (payload.code !== 0) {
    throw new Error(payload.message || '登录失败')
  }
  // 存储 access token 到内存
  if (payload.data?.token) {
    setAccessToken(payload.data.token)
  }
  return payload.data
}

/**
 * 用户注册
 * @param data 注册表单数据（含 emailCode 验证码）
 * @returns 注册结果（含 token）
 */
export async function registerApi(data: IUserRegisterDto & { emailCode: string }): Promise<IUserLogin> {
  const res = await instance.post<BackendResponse<IUserLogin>>('/register', { ...data, ret: 1 })
  const payload = res.data
  if (payload.code !== 0) {
    throw new Error(payload.message || '注册失败')
  }
  if (payload.data?.token) {
    setAccessToken(payload.data.token)
  }
  return payload.data
}

/**
 * 发送邮箱验证码
 * @param email 注册邮箱
 */
export async function sendEmailCodeApi(email: string): Promise<void> {
  const res = await instance.post<BackendResponse<unknown>>('/send-email-code', { email })
  const payload = res.data
  if (payload.code !== 0) {
    throw new Error(payload.message || '发送验证码失败')
  }
}

/**
 * 用户登出
 */
export async function logoutApi(): Promise<void> {
  try {
    await instance.post<BackendResponse<unknown>>('/logout')
  } catch { /* ignore */ }
  setAccessToken(null)
}

export default instance
