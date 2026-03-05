/**
 * 用户模型配置本地存储工具
 * ──────────────────────────────────────────────
 * @deprecated 模型配置已统一保存到服务端（API Key 加密存储），
 * 本文件保留仅为向后兼容迁移场景。
 * 新代码请使用 api/settings.ts 中的 updateSettings / getSettings。
 */
import { STORAGE_KEYS } from '@/constants/storage'

/** 用户本地模型配置（已废弃，模型配置统一由服务端管理） */
export interface LocalModelConfig {
  apiKey: string
  baseUrl: string
  model: string
  temperature: number
  maxTokens: number
  systemPrompt: string
  contextLength: number
}

/** @deprecated 已迁移至服务端存储 */
export function saveLocalModelConfig(_config: Partial<LocalModelConfig>): void
{
  // no-op: 模型配置已统一保存到服务端
}

/** @deprecated 已迁移至服务端存储 */
export function loadLocalModelConfig(): Partial<LocalModelConfig> | null
{
  return null
}

/** @deprecated 始终返回 false */
export function hasLocalModelConfig(): boolean
{
  return false
}

/** 清空旧的本地模型配置（迁移后调用一次） */
export function clearLocalModelConfig(): void
{
  try
  {
    localStorage.removeItem(STORAGE_KEYS.USER_MODEL_CONFIG)
  }
  catch
  { /* 静默 */ }
}

/** @deprecated 返回 undefined，模型配置统一由服务端管理 */
export function getModelConfigOverride(): undefined
{
  return undefined
}
