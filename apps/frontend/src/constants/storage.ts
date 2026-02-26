/**
 * 前端 localStorage 键名集中管理
 * 统一前缀便于排查与清理，所有持久化 key 仅在此处定义
 */
const PREFIX = 'u-blog-'

export const STORAGE_KEYS = {
  /** 主题：light / dark / system */
  THEME: `${PREFIX}theme`,
  /** Chat 会话列表 JSON */
  CHAT_SESSIONS: `${PREFIX}chat-sessions`,
  /** Chat 页右侧面板是否展开 */
  CHAT_SIDEBAR_VISIBLE: `${PREFIX}chat-sidebar-visible`,
  /** 全局侧栏：折叠状态 */
  SIDEBAR_COLLAPSED: `${PREFIX}sidebar-collapsed`,
  /** 全局侧栏：当前激活面板 id */
  SIDEBAR_ACTIVE_PANEL: `${PREFIX}sidebar-activePanel`,
  /** 全局侧栏：上次激活的面板 id */
  SIDEBAR_LAST_ACTIVE_PANEL: `${PREFIX}sidebar-lastActivePanel`,
  /** 界面语言：zh / en */
  LANGUAGE: `${PREFIX}language`,
  /** 首页文章列表样式：base / card / waterfall / compact */
  ARTICLE_LIST_TYPE: `${PREFIX}article-list-type`,
  /** 首页文章排序：date / hot / likes / trending */
  HOME_SORT: `${PREFIX}home-sort`,
  /** 视觉样式：default / glass */
  VISUAL_STYLE: `${PREFIX}visual-style`,
  /** 归档页卡片展示方案：summary_tags | cover_info | minimal_expand | stats_bar | timeline_tags | magazine */
  ARCHIVE_CARD_STYLE: `${PREFIX}archive-card-style`,
  /** 飘雪模式：off | auto | on */
  SNOWFALL_MODE: `${PREFIX}snowfall-mode`,
  /** 飘雪数量 */
  SNOWFALL_COUNT: `${PREFIX}snowfall-count`,
  /** 飘雪层级 z-index */
  SNOWFALL_Z_INDEX: `${PREFIX}snowfall-z-index`,
  /** 飘雪主题色预设：default | ice */
  SNOWFALL_THEME_PRESET: `${PREFIX}snowfall-theme-preset`,
  /** 飘雪尺寸范围 px */
  SNOWFALL_SIZE_MIN: `${PREFIX}snowfall-size-min`,
  SNOWFALL_SIZE_MAX: `${PREFIX}snowfall-size-max`,
  /** 飘雪下落速度 1-10，1 最慢 */
  SNOWFALL_SPEED: `${PREFIX}snowfall-speed`,
  /** 飘雪水平分布 0-100，0 居中 100 全屏 */
  SNOWFALL_DISTRIBUTION: `${PREFIX}snowfall-distribution`,
  /** 今日有雪缓存：日期 YYYY-MM-DD -> '1'，用于自动模式 */
  SNOWFALL_DAY_SNOW_CACHE: `${PREFIX}snowfall-day-snow`,
  /** 撰写页草稿内容（Markdown） */
  WRITE_DRAFT: `${PREFIX}write-draft`,
  /** Chat 模型调参（temperature / maxTokens / contextLength）JSON */
  CHAT_MODEL_PARAMS: `${PREFIX}chat-model-params`,
  /** Chat 字号大小（数字，单位 px，如 15） */
  CHAT_FONT_SIZE: `${PREFIX}chat-font-size`,
  /** Chat 文件夹列表 JSON */
  CHAT_FOLDERS: `${PREFIX}chat-folders`,
  /** Chat 文件夹展开状态 JSON */
  CHAT_FOLDERS_OPEN: `${PREFIX}chat-folders-open`,
  /** 用户个人模型配置（非管理员本地存储） */
  USER_MODEL_CONFIG: `${PREFIX}user-model-config`,
  /** 小惠会话列表 JSON */
  XIAOHUI_SESSIONS: `${PREFIX}xiaohui-sessions`,
  /** 小惠当前会话 ID */
  XIAOHUI_CURRENT_SESSION: `${PREFIX}xiaohui-current-session`,
  /** 小惠侧栏是否展开 */
  XIAOHUI_SIDEBAR_VISIBLE: `${PREFIX}xiaohui-sidebar-visible`,
  /** 小惠文件夹列表 JSON */
  XIAOHUI_FOLDERS: `${PREFIX}xiaohui-folders`,
  /** 小惠文件夹展开状态 JSON */
  XIAOHUI_FOLDERS_OPEN: `${PREFIX}xiaohui-folders-open`,
  /** 全局字号缩放（百分比 80~130，默认 100） */
  FONT_SIZE_SCALE: `${PREFIX}font-size-scale`,
  /** 全局行高缩放（百分比 100~200，默认 150） */
  LINE_HEIGHT_SCALE: `${PREFIX}line-height-scale`,
  /** 全局内容间距缩放（百分比 50~150，默认 100） */
  CONTENT_SPACING_SCALE: `${PREFIX}content-spacing-scale`,
  /** 全局字体族 preset（system / serif / mono） */
  FONT_FAMILY_PRESET: `${PREFIX}font-family-preset`,
} as const
