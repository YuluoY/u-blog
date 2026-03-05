/**
 * AI 文本生成 API
 * ──────────────────────────────────────────────
 * 统一封装 POST /ai/generate 接口，
 * 模型配置统一从服务端读取（API Key 加密存储在服务端）。
 */
import request from './request'
import type { BackendResponse } from './request'

/** AI 生成请求参数 */
export interface AiGenerateParams {
  /** 系统提示词（指令描述） */
  prompt: string
  /** 待处理的用户内容 */
  content: string
  /** 可选的模型配置覆盖，留空时使用服务端全局配置 */
  config?: {
    apiKey: string
    baseUrl?: string
    model?: string
    temperature?: number
    maxTokens?: number
  }
}

/** AI 生成响应数据 */
export interface AiGenerateResult {
  text: string
}

/**
 * 调用 AI 文本生成接口
 * 模型配置统一从服务端读取，无需前端传递 API Key
 */
export async function generateAiText(params: AiGenerateParams): Promise<string>
{
  const config = params.config

  const res = await request.post<BackendResponse<AiGenerateResult>>(
    '/ai/generate',
    {
      prompt: params.prompt,
      content: params.content,
      ...(config ? { config } : {}),
    },
    { timeout: 60_000 }, // AI 生成可能较慢，超时延长至 60s
  )

  const payload = res.data
  if (payload.code !== 0)
  
    throw new Error(payload.message || 'AI 生成失败')
  

  return payload.data?.text ?? ''
}
