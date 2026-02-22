import type { Request } from 'express'
import type { Repository } from 'typeorm'
import OpenAI from 'openai'
import type { Stream } from 'openai/streaming'
import { UserSetting } from '@/module/schema/UserSetting'
import { getDataSource, decrypt } from '@/utils'

/* ========== 类型定义 ========== */

/** 前端传入的消息格式 */
export interface ChatRequestMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

/** AI 模型完整配置（含生成参数） */
export interface ModelConfig {
  apiKey: string
  baseUrl: string
  model: string
  temperature: number
  maxTokens: number
  systemPrompt: string
  contextLength: number
}

/** 前端可传入的模型配置覆盖项（用户自供 API Key 场景） */
export interface ModelConfigOverride {
  apiKey: string
  baseUrl?: string
  model?: string
  temperature?: number
  maxTokens?: number
}

/* ========== 默认值常量 ========== */

/** 默认系统提示词：定义助手角色与行为 */
const DEFAULT_SYSTEM_PROMPT = `你是一个友好且机智的博客助手。
- 你的回复简洁、实用、有条理
- 支持 Markdown 格式输出
- 当用户提出编程问题时，提供代码示例
- 如果不确定答案，诚实告知而非编造
- 使用用户的语言进行回复（中文 / 英文）`

const DEFAULT_MODEL = 'gpt-3.5-turbo'
const DEFAULT_TEMPERATURE = 0.7
const DEFAULT_MAX_TOKENS = 4096
const DEFAULT_CONTEXT_LENGTH = 20

/** 所有需要查询的 Setting key */
const SETTING_KEYS = [
  'openai_api_key',
  'openai_base_url',
  'openai_model',
  'openai_temperature',
  'openai_max_tokens',
  'openai_system_prompt',
  'openai_context_length',
] as const

/* ========== 服务实现 ========== */

class ChatService {

  /**
   * 从 user_setting 表读取当前用户的模型配置（用户级隔离，不走全局 fallback）
   * @throws {Error} 未配置 API Key 时抛出
   */
  private async getModelConfig(req: Request): Promise<ModelConfig> {
    const ds = getDataSource(req)
    const userId = req.user?.id

    // 仅从当前用户的 user_setting 读取（AI 配置严格按用户隔离，无全局 fallback）
    const map = new Map<string, unknown>()

    if (userId) {
      const userSettingRepo = ds.getRepository(UserSetting) as Repository<UserSetting>
      const userRows = await userSettingRepo.createQueryBuilder('us')
        .where('us.userId = :userId', { userId })
        .andWhere('us.key IN (:...keys)', { keys: [...SETTING_KEYS] })
        .getMany()
      for (const r of userRows) map.set(r.key, r.value)
    }

    const apiKey = (map.get('openai_api_key') ?? '') as string
    // 解密 AES 加密的 API Key（兼容旧未加密数据）
    let decryptedKey = apiKey
    if (apiKey && apiKey.includes(':')) {
      try { decryptedKey = decrypt(apiKey) } catch { decryptedKey = apiKey }
    }
    if (!decryptedKey) {
      throw new Error('未配置 AI 模型 API Key，请在设置面板 → 模型配置中填写')
    }

    // 解析数值型配置，带范围限制
    const rawTemp = Number(map.get('openai_temperature'))
    const temperature = Number.isFinite(rawTemp) ? Math.min(2, Math.max(0, rawTemp)) : DEFAULT_TEMPERATURE

    const rawMax = Number(map.get('openai_max_tokens'))
    // 不限制上界——由模型提供商自身的 token 限制约束（128k / 200k / 1M 等）
    const maxTokens = Number.isFinite(rawMax) ? Math.max(1, Math.round(rawMax)) : DEFAULT_MAX_TOKENS

    const rawCtx = Number(map.get('openai_context_length'))
    const contextLength = Number.isFinite(rawCtx) ? Math.min(50, Math.max(1, Math.round(rawCtx))) : DEFAULT_CONTEXT_LENGTH

    const systemPrompt = ((map.get('openai_system_prompt') as string) || '').trim() || DEFAULT_SYSTEM_PROMPT

    return {
      apiKey: decryptedKey,
      baseUrl: (map.get('openai_base_url') as string) || 'https://api.openai.com/v1',
      model: (map.get('openai_model') as string) || DEFAULT_MODEL,
      temperature,
      maxTokens,
      systemPrompt,
      contextLength,
    }
  }

  /** 构建 OpenAI 客户端实例 */
  private createClient(config: ModelConfig): OpenAI {
    return new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    })
  }

  /**
   * 组装对话消息（系统提示 + RAG 上下文 + 上下文裁剪）
   * @param ragContext 可选 RAG 检索到的历史会话摘要，拼接在系统提示词后
   */
  private buildMessages(
    messages: ChatRequestMessage[],
    config: ModelConfig,
    ragContext?: string,
  ): OpenAI.ChatCompletionMessageParam[] {
    const trimmed = messages.slice(-config.contextLength)
    // 若有 RAG 上下文，追加到系统提示词中
    const systemContent = ragContext
      ? `${config.systemPrompt}\n\n---\n以下是从用户历史会话中检索到的可能相关的内容，请在回答时酌情参考：\n${ragContext}`
      : config.systemPrompt
    return [
      { role: 'system', content: systemContent },
      ...trimmed.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ]
  }

  /**
   * 流式聊天：返回 OpenAI 流对象，调用方逐 chunk 读取写入 SSE
   * @param ragContext 可选的 RAG 检索上下文
   */
  async chatStream(
    req: Request,
    messages: ChatRequestMessage[],
    override?: ModelConfigOverride,
    ragContext?: string,
  ): Promise<Stream<OpenAI.ChatCompletionChunk>> {
    const config = await this.getModelConfig(req)
    // 应用调用方传入的参数覆盖（温度、最大输出等）
    if (override) {
      if (override.temperature != null) config.temperature = Math.min(2, Math.max(0, override.temperature))
      // 不限制上界——由模型提供商约束
      if (override.maxTokens != null) config.maxTokens = Math.max(1, Math.round(override.maxTokens))
    }
    const client = this.createClient(config)

    return client.chat.completions.create({
      model: config.model,
      messages: this.buildMessages(messages, config, ragContext),
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      stream: true,
    })
  }

  /** 非流式聊天（保留兼容） */
  async chat(req: Request, messages: ChatRequestMessage[]): Promise<string> {
    const config = await this.getModelConfig(req)
    const client = this.createClient(config)

    const completion = await client.chat.completions.create({
      model: config.model,
      messages: this.buildMessages(messages, config),
      temperature: config.temperature,
      max_tokens: config.maxTokens,
    })

    const reply = completion.choices?.[0]?.message?.content?.trim()
    if (!reply) throw new Error('AI 模型返回了空回复')
    return reply
  }

  /**
   * 单次 AI 生成（非流式）——用于 bio 生成、文本润色等场景
   * @param req         Express 请求对象（用于获取 DataSource）
   * @param system      系统提示词（指令描述）
   * @param content     用户内容（待处理文本）
   * @param override    可选的用户自供模型配置（普通用户场景）
   * @returns 生成的文本
   */
  async generate(
    req: Request,
    system: string,
    content: string,
    override?: ModelConfigOverride,
  ): Promise<string> {
    // 若用户提供了自己的 API Key，使用其配置；否则使用全局配置
    let config: ModelConfig
    if (override?.apiKey) {
      config = {
        apiKey: override.apiKey,
        baseUrl: override.baseUrl || 'https://api.openai.com/v1',
        model: override.model || DEFAULT_MODEL,
        temperature: override.temperature ?? DEFAULT_TEMPERATURE,
        maxTokens: override.maxTokens ?? DEFAULT_MAX_TOKENS,
        systemPrompt: system,
        contextLength: 1,
      }
    } else {
      config = await this.getModelConfig(req)
    }

    const client = this.createClient(config)
    const completion = await client.chat.completions.create({
      model: config.model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content },
      ],
      temperature: config.temperature,
      max_tokens: config.maxTokens,
    })

    const reply = completion.choices?.[0]?.message?.content?.trim()
    if (!reply) throw new Error('AI 模型返回了空回复')
    return reply
  }
}

export default new ChatService()
