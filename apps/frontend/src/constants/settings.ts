/**
 * 站点设置 key 常量，与后端 Setting 表 key 一致
 */
export const SETTING_KEYS = {
  /** 外观：主题 dark / default */
  THEME: 'theme',
  /** 外观：语言 zh / en */
  LANGUAGE: 'language',
  /** 外观：首页文章列表样式 base / card / waterfall / compact */
  ARTICLE_LIST_TYPE: 'article_list_type',
  /** OpenAI API Key */
  OPENAI_API_KEY: 'openai_api_key',
  /** OpenAI Base URL（可换代理） */
  OPENAI_BASE_URL: 'openai_base_url',
  /** 对话模型名称，如 gpt-4o、gpt-3.5-turbo */
  OPENAI_MODEL: 'openai_model',
  /** 站点名称 */
  SITE_NAME: 'site_name',
  /** 站点描述/副标题 */
  SITE_DESCRIPTION: 'site_description',
  /** 站点关键词（SEO） */
  SITE_KEYWORDS: 'site_keywords',
} as const

/** 需要脱敏显示的 key（后端会返回 masked） */
export const MASKED_SETTING_KEYS: Set<string> = new Set([
  SETTING_KEYS.OPENAI_API_KEY,
  SETTING_KEYS.OPENAI_BASE_URL,
])
