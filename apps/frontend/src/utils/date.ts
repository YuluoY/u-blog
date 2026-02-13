export interface UDateFormatOptions {
  /**
   * @description 无效日期时的兜底文本
   * @default '--'
   */
  fallback?: string
}

/**
 * 将日期值格式化为统一的展示文本。
 *
 * 设计说明：
 * - 统一前端所有发布时间/更新时间的展示格式，避免不同页面出现原始 ISO 字符串。
 * - 输出格式固定为：`YYYY年MM月DD日`，满足中文站点一致的日期展示规范。
 *
 * @param value 日期值，支持 `Date | string | number`
 * @param options 格式化配置
 * @returns 格式化后的文本；若值无效，返回 `fallback`
 */
export function formatDateTime(
  value: Date | string | number | null | undefined,
  options: UDateFormatOptions = {}
): string
{
  const { fallback = '--' } = options

  if (value === null || value === undefined || value === '')
    return fallback

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime()))
    return fallback

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}年${month}月${day}日`
}
