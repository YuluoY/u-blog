/**
 * AI 模型厂商预设配置
 * ──────────────────────────────────────────────
 * 支持国内主流大模型厂商，均兼容 OpenAI SDK 格式。
 * 数据更新于 2026-03-06
 */

/** 单个模型条目 */
export interface AiModel {
  /** 模型 ID（传给 API 的值） */
  id: string
  /** 显示名称 */
  label: string
  /** 简短描述 */
  desc?: string
}

/** 厂商预设 */
export interface AiProvider {
  /** 厂商唯一标识 */
  key: string
  /** 显示名称 */
  label: string
  /** API Base URL（OpenAI 兼容） */
  baseUrl: string
  /** 可选模型列表 */
  models: AiModel[]
  /** 默认推荐模型 ID */
  defaultModel: string
  /** 厂商图标 class（FontAwesome 或自定义） */
  icon?: string
}

/** 全部厂商预设列表 */
export const AI_PROVIDERS: AiProvider[] = [
  {
    key: 'deepseek',
    label: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    models: [
      { id: 'deepseek-chat', label: 'DeepSeek Chat (V3.2)', desc: '128K 通用对话' },
      { id: 'deepseek-reasoner', label: 'DeepSeek Reasoner', desc: '128K 推理增强' },
    ],
  },
  {
    key: 'qwen',
    label: 'Qwen (通义千问)',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen3.5-plus',
    models: [
      { id: 'qwen3-max', label: 'Qwen3-Max', desc: '262K 旗舰最强' },
      { id: 'qwen3.5-plus', label: 'Qwen3.5-Plus', desc: '1M 均衡' },
      { id: 'qwen3.5-flash', label: 'Qwen3.5-Flash', desc: '1M 快速' },
      { id: 'qwen-plus', label: 'Qwen-Plus', desc: '1M 通用' },
      { id: 'qwen-flash', label: 'Qwen-Flash', desc: '1M 极快低价' },
      { id: 'qwen3-coder-plus', label: 'Qwen3-Coder-Plus', desc: '1M 代码专用' },
    ],
  },
  {
    key: 'glm',
    label: 'GLM (智谱清言)',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModel: 'glm-5-plus',
    models: [
      { id: 'glm-5-plus', label: 'GLM-5-Plus', desc: '旗舰最强' },
      { id: 'glm-5', label: 'GLM-5', desc: '高性价比' },
      { id: 'glm-4-plus', label: 'GLM-4-Plus', desc: '上代旗舰' },
      { id: 'glm-4-air-250414', label: 'GLM-4-Air', desc: '均衡性价比' },
      { id: 'glm-4-flashx', label: 'GLM-4-FlashX', desc: '轻量快速' },
      { id: 'glm-4-flash-250414', label: 'GLM-4-Flash', desc: '免费轻量' },
    ],
  },
  {
    key: 'minimax',
    label: 'MiniMax',
    baseUrl: 'https://api.minimax.chat/v1',
    defaultModel: 'MiniMax-M2.5',
    models: [
      { id: 'MiniMax-M2.5', label: 'MiniMax-M2.5', desc: '204K 旗舰' },
      { id: 'MiniMax-M2.1', label: 'MiniMax-M2.1', desc: '通用对话' },
    ],
  },
  {
    key: 'minimax-mcp',
    label: 'MiniMax (Code)',
    baseUrl: 'https://api.minimax.chat/v1',
    defaultModel: 'MiniMax-M2.5',
    models: [
      { id: 'MiniMax-M2.5', label: 'MiniMax-M2.5', desc: 'Code Plan 旗舰' },
      { id: 'MiniMax-M2.1', label: 'MiniMax-M2.1', desc: 'Code Plan 通用' },
    ],
  },
  {
    key: 'doubao',
    label: '豆包 (Doubao)',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    defaultModel: 'doubao-seed-1-6-251015',
    models: [
      { id: 'doubao-seed-1-6-251015', label: 'Doubao-Seed-1.6', desc: '旗舰模型' },
      { id: 'doubao-seed-2.0', label: 'Doubao-Seed-2.0', desc: '最新 Agent 模型' },
    ],
  },
] as const

/** 根据 key 查找厂商 */
export function findProvider(key: string): AiProvider | undefined
{
  return AI_PROVIDERS.find(p => p.key === key)
}

/** 根据 baseUrl 反向匹配厂商（用于回显已有配置） */
export function matchProviderByUrl(baseUrl: string): AiProvider | undefined
{
  if (!baseUrl) return undefined
  const normalized = baseUrl.replace(/\/+$/, '')
  return AI_PROVIDERS.find(p => normalized === p.baseUrl.replace(/\/+$/, ''))
}
