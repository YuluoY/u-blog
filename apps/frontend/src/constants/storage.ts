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
} as const
