/**
 * 从 User-Agent 中提取主版本号（如 Chrome/144.0.0.0 -> 144）
 */
function parseVersion(ua: string, pattern: RegExp): string | undefined {
  const m = ua.match(pattern)
  if (!m?.[1]) return undefined
  const v = m[1].split('.')[0]
  return v ? v.trim() : undefined
}

/**
 * 从 User-Agent 解析浏览器（含主版本号）与设备类型（简单实现，用于评论等记录）
 * 返回如 browser: "Chrome 144", device: "Desktop"
 */
export function parseUserAgent(ua: string | undefined): { browser?: string; device?: string } {
  if (!ua || typeof ua !== 'string') return {}
  const s = ua
  let browser: string | undefined
  let device: string | undefined

  // 浏览器 + 版本：按优先级匹配并取主版本号
  if (/Edg\//.test(s)) {
    browser = 'Edge'
    const v = parseVersion(s, /Edg\/([\d.]+)/)
    if (v) browser = `Edge ${v}`
  } else if (/Chrome\//.test(s) && !/Chromium|Edg/.test(s)) {
    browser = 'Chrome'
    const v = parseVersion(s, /Chrome\/([\d.]+)/)
    if (v) browser = `Chrome ${v}`
  } else if (/Firefox\//.test(s)) {
    browser = 'Firefox'
    const v = parseVersion(s, /Firefox\/([\d.]+)/)
    if (v) browser = `Firefox ${v}`
  } else if (/Safari\//.test(s) && !/Chrome/.test(s)) {
    browser = 'Safari'
    const v = parseVersion(s, /Version\/([\d.]+)/)
    if (v) browser = `Safari ${v}`
  } else if (/OPR\//.test(s)) {
    browser = 'Opera'
    const v = parseVersion(s, /OPR\/([\d.]+)/)
    if (v) browser = `Opera ${v}`
  } else if (/Opera\//.test(s)) {
    browser = 'Opera'
    const v = parseVersion(s, /Opera\/([\d.]+)/)
    if (v) browser = `Opera ${v}`
  } else if (/MSIE\s([\d.]+)/.test(s)) {
    const v = parseVersion(s, /MSIE\s([\d.]+)/)
    browser = v ? `IE ${v}` : 'IE'
  } else if (/Trident\//.test(s)) {
    const v = parseVersion(s, /rv:([\d.]+)/)
    browser = v ? `IE ${v}` : 'IE'
  } else if (/MicroMessenger/.test(s)) browser = 'WeChat'
  else if (/Weibo/.test(s)) browser = 'Weibo'
  else if (/QQ\//.test(s)) browser = 'QQ'
  else if (/MiuiBrowser/.test(s)) browser = 'MiuiBrowser'
  else if (/UCBrowser/.test(s)) browser = 'UC'

  // 设备：Mobile / Tablet / Desktop
  if (/Mobile|Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(s)) {
    device = /iPad|Tablet/.test(s) ? 'Tablet' : 'Mobile'
  } else {
    device = 'Desktop'
  }

  return { browser, device }
}
