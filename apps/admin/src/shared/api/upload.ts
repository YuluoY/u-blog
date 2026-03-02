import { apiClient } from './client'
import type { BackendResponse } from './types'

/** 上传接口返回结构 */
export interface UploadResult {
  /** 资源相对路径，如 /uploads/xxx.jpg */
  url: string
  /** Media 表记录 ID */
  mediaId: number
  /** 原始文件名 */
  name: string
  /** 文件大小（字节） */
  size: number
  /** MIME 类型 */
  mimeType: string
}

/**
 * 通用文件上传（走后端 POST /upload）
 * @param file 要上传的文件
 * @returns 上传结果（包含可访问的 url）
 */
export async function uploadFile(file: File): Promise<UploadResult> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await apiClient.post<BackendResponse<UploadResult>>('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    // 上传大文件给足超时
    timeout: 60000,
  })
  return res.data.data
}
