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

/**
 * 从 User-Agent 解析操作系统名称
 * 返回如 "Windows 10"、"macOS"、"Android 14"、"iOS 17" 等
 */
export function parseOs(ua: string | undefined): string | undefined {
  if (!ua || typeof ua !== 'string') return undefined

  if (/Windows NT 10/.test(ua)) return 'Windows 10'
  if (/Windows NT 6\.3/.test(ua)) return 'Windows 8.1'
  if (/Windows NT 6\.2/.test(ua)) return 'Windows 8'
  if (/Windows NT 6\.1/.test(ua)) return 'Windows 7'
  if (/Windows/.test(ua)) return 'Windows'

  if (/Mac OS X/.test(ua)) {
    if (/iPhone|iPad|iPod/.test(ua)) {
      const m = ua.match(/OS (\d+)[_.](\d+)/)
      return m ? `iOS ${m[1]}` : 'iOS'
    }
    return 'macOS'
  }

  if (/Android/.test(ua)) {
    const m = ua.match(/Android ([\d.]+)/)
    return m ? `Android ${m[1].split('.')[0]}` : 'Android'
  }

  if (/Linux/.test(ua)) return 'Linux'
  if (/CrOS/.test(ua)) return 'ChromeOS'
  if (/Ubuntu/.test(ua)) return 'Ubuntu'

  return undefined
}
