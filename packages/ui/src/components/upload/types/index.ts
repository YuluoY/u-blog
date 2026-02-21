/** 上传组件展示类型 */
export type UploadListType = 'text' | 'picture-card'

/** 上传文件信息 */
export interface UploadFile {
  /** 文件名 */
  name: string
  /** 文件大小（字节） */
  size: number
  /** MIME 类型 */
  type: string
  /** 预览 URL（base64 或 Object URL） */
  url: string
  /** 原始 File 对象 */
  raw?: File
}

export interface UUploadProps {
  /** 当前文件值（URL 或 base64 字符串） */
  modelValue?: string
  /** 接受的文件类型（对应原生 input[accept]） */
  accept?: string
  /** 最大文件大小（单位：MB） */
  maxSize?: number
  /** 是否禁用 */
  disabled?: boolean
  /** 是否支持拖拽 */
  drag?: boolean
  /** 展示类型 */
  listType?: UploadListType
  /** 拖放区占位文案 */
  placeholder?: string
  /** 预览图的适应模式 */
  fit?: 'cover' | 'contain' | 'fill'
  /** 拖放区宽高比（CSS aspect-ratio 值，如 '16/9'） */
  aspectRatio?: string
}

export interface UUploadEmits {
  (e: 'update:modelValue', value: string): void
  (e: 'change', file: UploadFile): void
  (e: 'remove'): void
  (e: 'exceed', file: File): void
}

export interface UUploadExposes {
  /** 打开文件选择器 */
  openFileDialog: () => void
  /** 清除当前文件 */
  clear: () => void
}
