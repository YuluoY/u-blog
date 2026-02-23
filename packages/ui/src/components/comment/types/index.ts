/**
 * 评论组件用到的单条数据结构（与 IComment 兼容，不依赖 @u-blog/model）
 */
export interface UCommentUser {
  namec?: string
  username?: string
  avatar?: string
  [key: string]: unknown
}

export interface UCommentItemData {
  id: number
  userId: number
  user?: UCommentUser | null
  content: string
  path: string
  pid?: number | null
  parent?: UCommentItemData | null
  createdAt?: string | Date
  children?: UCommentItemData[]
  /** IP 解析的地名 */
  ipLocation?: string | null
  /** 浏览器 */
  browser?: string | null
  /** 设备类型 */
  device?: string | null
  /** 游客昵称 */
  nickname?: string | null
  /** 游客邮箱 */
  email?: string | null
}

/**
 * 从邮箱提取 QQ 头像 URL（仅 QQ 邮箱有效）
 * @param email - 邮箱地址
 * @returns QQ 头像 URL，非 QQ 邮箱返回 null
 */
export function getQQAvatarUrl(email?: string | null): string | null {
  if (!email) return null
  const match = email.match(/^(\d{5,11})@qq\.com$/i)
  if (!match) return null
  return `https://q1.qlogo.cn/g?b=qq&nk=${match[1]}&s=100`
}

/**
 * 为游客生成确定性随机头像 URL（基于 DiceBear Avatars）
 * 同一个 seed 始终产出同一头像，确保一致性
 * @param seed - 用于生成头像的种子字符串（昵称、邮箱等）
 * @returns 头像 URL
 */
export function getRandomAvatarUrl(seed: string): string {
  const encoded = encodeURIComponent(seed.trim().toLowerCase())
  return `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${encoded}`
}

/**
 * 获取游客头像 URL：QQ 邮箱 → QQ 头像，其他 → DiceBear 随机头像
 * @param email - 邮箱地址
 * @param nickname - 游客昵称（作为兜底种子）
 * @returns 头像 URL（始终有值）
 */
export function getGuestAvatarUrl(email?: string | null, nickname?: string | null): string {
  // 优先使用 QQ 头像
  const qqAvatar = getQQAvatarUrl(email)
  if (qqAvatar) return qqAvatar
  // 使用邮箱或昵称作为种子生成随机头像
  const seed = email || nickname || 'anonymous'
  return getRandomAvatarUrl(seed)
}

export interface UCommentItemProps {
  /** 单条评论数据 */
  comment: UCommentItemData
  /** 是否渲染为纯文本（不解析 MD） */
  plainContent?: boolean
  /** 当前正在回复的评论 id（由父组件控制） */
  replyingId?: number | null
  /** 回复输入框的值 */
  replyContent?: string
  /** 回复提交中 */
  replyLoading?: boolean
  /** 当前用户是否已登录（控制回复按钮可见） */
  loggedIn?: boolean
  /** 嵌套深度（内部使用） */
  depth?: number
  /** 是否渲染子评论块（列表单级展示时由 List 统一渲染，设为 false） */
  showChildren?: boolean
}

export interface UCommentItemEmits {
  (e: 'reply', comment: UCommentItemData): void
  (e: 'reply-submit', content: string, comment: UCommentItemData): void
  (e: 'reply-cancel'): void
  (e: 'update:replyContent', value: string): void
  /** 点击「回复 @某人」时触发，用于平滑滚动到目标评论 */
  (e: 'scroll-to', commentId: number): void
}

export interface UCommentListProps {
  list: UCommentItemData[]
  loading?: boolean
  emptyText?: string
  plainContent?: boolean
  replyingId?: number | null
  replyContent?: string
  replyLoading?: boolean
  loggedIn?: boolean
  /** 单条根评论下回复超过该数量时折叠，展示「展开更多 N 条回复」；0 表示不折叠 */
  replyFoldThreshold?: number
}

export interface UCommentListEmits {
  (e: 'reply', comment: UCommentItemData): void
  (e: 'reply-submit', content: string, comment: UCommentItemData): void
  (e: 'reply-cancel'): void
  (e: 'update:replyContent', value: string): void
  (e: 'scroll-to', commentId: number): void
}

export interface UCommentInputProps {
  placeholder?: string
  maxLength?: number
  submitText?: string
  disabled?: boolean
  loading?: boolean
  modelValue?: string
  /** 紧凑模式（用于内联回复） */
  compact?: boolean
  /** 表情选择器面板主题，传则跟随网站主题；不传则根据 document 的 dark 类推断 */
  emojiPickerTheme?: 'light' | 'dark' | 'auto'
}

export interface UCommentInputEmits {
  (e: 'update:modelValue', value: string): void
  (e: 'submit', content: string): void
  (e: 'cancel'): void
  /** 用户从表情面板选择了表情，由父组件追加到 modelValue */
  (e: 'insert', text: string): void
}

export interface UCommentProps {
  title?: string
  subtitle?: string
  showTitle?: boolean
}

export interface UCommentEmits {
  (e: 'submit', content: string): void
  (e: 'reply', comment: UCommentItemData, content: string): void
}
