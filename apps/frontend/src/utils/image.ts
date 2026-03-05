/**
 * 将 /uploads/xxx.png 格式的图片 URL 转为 /uploads-opt/xxx.png?w=&q=&fmt=webp
 * 用于文章封面等场景，通过后端 sharp 实时压缩 + 格式转换降低传输体积
 *
 * @param src 原始图片 URL（如 /uploads/xxx.png）
 * @param options 优化参数
 * @returns 优化后的 URL，非 /uploads/ 路径的图片原样返回
 */
export function getOptimizedImageUrl(
  src: string | undefined | null,
  options: {
    /** 目标宽度，保持比例缩放 */
    width?: number
    /** 压缩质量 1-100，默认 80 */
    quality?: number
    /** 输出格式，默认 webp */
    format?: 'webp' | 'avif' | 'jpeg' | 'png'
  } = {}
): string {
  if (!src) return ''

  // 仅处理本站 /uploads/ 路径的图片
  if (!src.startsWith('/uploads/')) return src

  const { width, quality = 80, format = 'webp' } = options
  const relativePath = src.replace('/uploads/', '')
  const params = new URLSearchParams()

  if (width) params.set('w', String(width))
  params.set('q', String(quality))
  params.set('fmt', format)

  return `/uploads-opt/${relativePath}?${params.toString()}`
}

/** 文章封面常用预设 */
export const COVER_PRESETS = {
  /** 列表封面 — 卡片/基础模式 */
  list: { width: 640, quality: 80, format: 'webp' as const },
  /** 列表封面 — 紧凑/瀑布流（缩略图） */
  thumb: { width: 400, quality: 75, format: 'webp' as const },
  /** 文章详情顶部大图 */
  detail: { width: 1200, quality: 85, format: 'webp' as const },
} as const
