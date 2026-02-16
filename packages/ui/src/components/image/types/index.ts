export type UImageFit = 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'
export type UImageLoading = 'eager' | 'lazy'

export interface UImageProps {
  /** 图片源地址 */
  src: string
  /** 图片描述 */
  alt?: string
  /** 图片宽度 */
  width?: string | number
  /** 图片高度 */
  height?: string | number
  /** 图片适应容器方式 */
  fit?: UImageFit
  /** 加载策略 */
  loading?: UImageLoading
  /** 是否显示加载动画 */
  showLoading?: boolean
  /** 加载失败时的占位图 */
  errorSrc?: string
  /** 是否可预览（点击放大） */
  previewable?: boolean
  /** 图片圆角 */
  radius?: string | number
  /** 是否懒加载 */
  lazy?: boolean
}

export interface UImageEmits {
  (e: 'load', event: Event): void
  (e: 'error', event: Event): void
  (e: 'click', event: MouseEvent): void
}

export interface UImageExposes {
  /** 刷新图片 */
  reload: () => void
}