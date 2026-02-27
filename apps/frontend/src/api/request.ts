import axios from 'axios'
import type { IUserLogin, IUserRegisterDto, IUserLoginDto } from '@u-blog/model'
import { startProgress, endProgress, failProgress } from '@/composables/useProgressBar'

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

/* ---------- 请求拦截器：自动附带 Authorization 头 + 触发进度条 ---------- */
instance.interceptors.request.use((config) => {
  // 触发全局加载进度条
  startProgress()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

/* ---------- 响应拦截器：401 时清除 token，并提取后端 message ---------- */
instance.interceptors.response.use(
  (response) => {
    endProgress()
    return response
  },
  (error) => {
    failProgress()
    if (error.response?.status === 401) {
      accessToken = null
    }
    // 优先使用后端返回的 message，而非 axios 默认的 "Request failed with status code xxx"
    const backendMsg = error.response?.data?.message
    if (backendMsg && typeof backendMsg === 'string') {
      error.message = backendMsg
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
  body: { where?: Record<string, unknown>; take?: number; skip?: number; order?: Record<string, 'ASC' | 'DESC'>; relations?: string[]; select?: string[] } = {}
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

/**
 * 切换文章点赞状态（登录用户 DB 去重，游客 IP+fingerprint 去重）
 * @param articleId 文章 ID
 * @param fingerprint 可选的浏览器指纹
 * @returns { liked, likeCount }
 */
export async function toggleArticleLike(articleId: number, fingerprint?: string): Promise<{ liked: boolean; likeCount: number }> {
  const res = await instance.post<BackendResponse<{ liked: boolean; likeCount: number }>>('/article-like', { articleId, fingerprint })
  const payload = res.data
  if (payload.code !== 0) {
    throw new Error(payload.message || '操作失败')
  }
  return payload.data
}

/**
 * 查询文章点赞状态
 * @param articleId 文章 ID
 * @param fingerprint 可选的浏览器指纹
 * @returns { liked }
 */
export async function getArticleLikeStatus(articleId: number, fingerprint?: string): Promise<{ liked: boolean }> {
  const params: Record<string, string> = { articleId: String(articleId) }
  if (fingerprint) params.fingerprint = fingerprint
  const res = await instance.get<BackendResponse<{ liked: boolean }>>('/article-like-status', { params })
  const payload = res.data
  if (payload.code !== 0) {
    throw new Error(payload.message || '查询失败')
  }
  return payload.data
}

/* ---------- 认证相关 ---------- */

/** 注册状态信息 */
export interface RegistrationStatus {
  enabled: boolean
  reason: string
}

/**
 * 查询注册功能是否开放（公开接口，无需登录）
 */
export async function getRegistrationStatus(): Promise<RegistrationStatus> {
  const res = await instance.get<BackendResponse<RegistrationStatus>>('/registration-status')
  const payload = res.data
  if (payload.code !== 0) {
    return { enabled: false, reason: '查询失败' }
  }
  return payload.data
}

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

/**
 * 更新当前用户个人资料
 * @param data 可编辑字段：namec, avatar, bio, gender, birthday, location, website, socials
 */
export async function updateProfileApi<T = unknown>(data: Record<string, unknown>): Promise<T> {
  const res = await instance.put<BackendResponse<T>>('/profile', data)
  const payload = res.data
  if (payload.code !== 0) {
    throw new Error(payload.message || '更新个人资料失败')
  }
  return payload.data as T
}

/* ---------- QQ 信息查询 ---------- */

/** QQ 昵称缓存（避免重复请求） */
const qqNicknameCache = new Map<string, string>()

/**
 * 通过后端代理获取 QQ 昵称
 * @param qq QQ 号（5~11 位数字）
 * @returns 昵称字符串，获取失败时返回空字符串
 */
export async function fetchQQNickname(qq: string): Promise<string> {
  if (!/^\d{5,11}$/.test(qq)) return ''
  // 命中缓存直接返回
  if (qqNicknameCache.has(qq)) return qqNicknameCache.get(qq)!
  try {
    const res = await instance.get<BackendResponse<{ nickname: string; qq: string }>>('/qq-info', { params: { qq } })
    const nickname = res.data?.code === 0 ? (res.data.data?.nickname || '') : ''
    if (nickname) qqNicknameCache.set(qq, nickname)
    return nickname
  } catch {
    return ''
  }
}

export default instance
