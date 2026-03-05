/**
 * AI 文本生成通用 Composable
 * ──────────────────────────────────────────────
 * 封装加载状态、错误处理与调用逻辑，
 * 供「个人简介 AI 生成」「编辑器文本润色/扩写」等场景复用。
 */
import { ref } from 'vue'
import { generateAiText } from '@/api/ai'
import { UNotificationFn } from '@u-blog/ui'
import { useI18n } from 'vue-i18n'

/** AI 动作类型枚举 */
export type AiAction =
  | 'polish'    // 润色
  | 'expand'    // 扩写
  | 'condense'  // 缩写
  | 'translate' // 翻译
  | 'continue'  // 续写
  | 'explain'   // 解释
  | 'bio'       // 生成个人简介

/**
 * 根据动作类型和当前语言环境获取系统提示词
 * @param action AI 动作类型
 * @param locale 当前 i18n 语言标识
 */
function getPromptForAction(action: AiAction, locale: string): string
{
  const isZh = locale.startsWith('zh')

  const prompts: Record<AiAction, string> = {
    polish: isZh
      ? '你是一位专业的文字编辑。请润色以下文本，使其更加流畅、优雅，保持原意不变。仅返回润色后的文本，不要任何解释。'
      : 'You are a professional editor. Polish the following text to make it more fluent and elegant while preserving the original meaning. Return only the polished text, no explanations.',
    expand: isZh
      ? '你是一位优秀的写作助手。请扩写以下文本，补充更多细节和深度，保持原有风格和语气。仅返回扩写后的文本，不要任何解释。'
      : 'You are an excellent writing assistant. Expand the following text with more details and depth while maintaining the original style and tone. Return only the expanded text, no explanations.',
    condense: isZh
      ? '你是一位专业的文字编辑。请精简以下文本，保留核心信息，去除冗余表述。仅返回精简后的文本，不要任何解释。'
      : 'You are a professional editor. Condense the following text, keeping the key information and removing redundancy. Return only the condensed text, no explanations.',
    translate: isZh
      ? '你是一位专业翻译。请将以下文本翻译为英文。如果文本已是英文，则翻译为中文。仅返回翻译结果，不要任何解释。'
      : 'You are a professional translator. Translate the following text to Chinese. If it is already in Chinese, translate to English. Return only the translation, no explanations.',
    continue: isZh
      ? '你是一位创作助手。请基于以下文本继续写作，保持一致的风格和语气，自然衔接上文。仅返回续写内容（不重复原文），不要任何解释。'
      : 'You are a writing assistant. Continue writing from where the text ends, maintaining consistent style and tone. Return only the new content (do not repeat the original), no explanations.',
    explain: isZh
      ? '你是一位善于解释的老师。请用通俗易懂的语言解释以下文本的含义。仅返回解释内容，不要重复原文。'
      : 'You are a patient teacher. Explain the following text in simple, easy-to-understand language. Return only the explanation, do not repeat the original text.',
    bio: isZh
      ? '你是一位有创意的个人品牌顾问。请根据以下用户信息，生成一段简洁、有个性的个人简介。要求：1. 不超过80个字 2. 风格自然亲切 3. 突出个人特色 4. 适合在博客个人资料中展示。仅返回简介文本，不要任何解释或标点前缀。'
      : 'You are a creative personal branding consultant. Generate a concise, personality-rich bio based on the user info below. Requirements: 1. Under 80 words 2. Natural and friendly 3. Highlight personal traits 4. Suitable for a blog profile. Return only the bio text, no explanations or prefixes.',
  }

  return prompts[action]
}

/**
 * AI 文本生成 Composable
 * @returns generating（加载态）、error（错误信息）、generate（执行生成）
 */
export function useAiGenerate()
{
  const { t, locale } = useI18n()

  /** 是否正在生成 */
  const generating = ref(false)
  /** 上次错误信息 */
  const error = ref<string | null>(null)

  /**
   * 执行 AI 文本生成
   * @param action  AI 动作类型
   * @param content 待处理的文本内容
   * @returns 生成的文本；失败时返回空字符串
   */
  async function generate(action: AiAction, content: string): Promise<string>
  {
    error.value = null
    generating.value = true
    try
    {
      const prompt = getPromptForAction(action, locale.value)
      return await generateAiText({ prompt, content })
    }
    catch (err: any)
    {
      const msg = err?.message || t('ai.generateFailed')
      error.value = msg
      UNotificationFn({ message: msg, type: 'error', deduplicate: true })
      return ''
    }
    finally
    {
      generating.value = false
    }
  }

  return { generating, error, generate }
}
