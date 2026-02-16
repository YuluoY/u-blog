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
