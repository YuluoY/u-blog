import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/en'
import i18n from '../../app/i18n'

dayjs.extend(relativeTime)

/**
 * 人性化日期：相对时间（如「3 天前」），随 i18n 语言；不足 1 分钟显示「刚刚」/「Just now」
 */
export function formatDateRelative(date: string | Date | null | undefined): string {
  if (date == null) return '—'
  const locale = i18n.language === 'en' ? 'en' : 'zh-cn'
  const d = dayjs(date).locale(locale)
  if (!d.isValid()) return '—'
  const diff = dayjs().diff(d, 'second')
  if (diff < 60) return i18n.t('common.justNow')
  return d.fromNow()
}

/**
 * 完整日期时间，用于表格或详情，随 i18n 语言（数字格式一致，月/周等随 locale）
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (date == null) return '—'
  const locale = i18n.language === 'en' ? 'en' : 'zh-cn'
  const d = dayjs(date).locale(locale)
  return d.isValid() ? d.format('YYYY-MM-DD HH:mm') : '—'
}

/**
 * 仅日期，随 i18n 语言
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (date == null) return '—'
  const locale = i18n.language === 'en' ? 'en' : 'zh-cn'
  const d = dayjs(date).locale(locale)
  return d.isValid() ? d.format('YYYY-MM-DD') : '—'
}
