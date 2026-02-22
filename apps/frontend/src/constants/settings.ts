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
  /** 外观：首页文章排序 date / hot / likes / trending */
  HOME_SORT: 'home_sort',
  /** 外观：视觉样式 default / glass */
  VISUAL_STYLE: 'visual_style',
  /** OpenAI API Key */
  OPENAI_API_KEY: 'openai_api_key',
  /** OpenAI Base URL（可换代理） */
  OPENAI_BASE_URL: 'openai_base_url',
  /** 对话模型名称，如 deepseek-chat、qwen-turbo、glm-4 */
  OPENAI_MODEL: 'openai_model',
  /** 模型温度（0~2） */
  OPENAI_TEMPERATURE: 'openai_temperature',
  /** 最大输出 token 数 */
  OPENAI_MAX_TOKENS: 'openai_max_tokens',
  /** 自定义系统提示词（助手人设） */
  OPENAI_SYSTEM_PROMPT: 'openai_system_prompt',
  /** 上下文消息数上限 */
  OPENAI_CONTEXT_LENGTH: 'openai_context_length',
  /** 聊天字号（用户级） */
  CHAT_FONT_SIZE: 'chat_font_size',
  /** 站点名称 */
  SITE_NAME: 'site_name',
  /** 站点描述/副标题 */
  SITE_DESCRIPTION: 'site_description',
  /** 站点关键词（SEO） */
  SITE_KEYWORDS: 'site_keywords',
  /** 站点图标（favicon URL） */
  SITE_FAVICON: 'site_favicon',
  /** 可见路由（JSON 数组，如 ["home","archive","message","links","chat"]） */
  VISIBLE_ROUTES: 'visible_routes',
  /** 友链申请邮件通知开关（'true' / 'false'） */
  FRIEND_LINK_NOTIFY: 'friend_link_notify',
  /** 仅显示自己的文章（'true' / 'false'） */
  ONLY_OWN_ARTICLES: 'only_own_articles',
  /** 博客主题风格 */
  BLOG_THEME: 'blog_theme',
} as const

/** 需要脱敏显示的 key（后端会返回 masked） */
export const MASKED_SETTING_KEYS: Set<string> = new Set([
  SETTING_KEYS.OPENAI_API_KEY,
  // openai_base_url 不再脱敏：它只是 URL，脱敏会导致回显失败并在下次保存时被空字符串覆盖
])

/** 文章「火热」标识：浏览量不低于此值则显示火热角标 */
export const ARTICLE_HOT_VIEW_THRESHOLD = 100
