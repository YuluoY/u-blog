/**
 * IP 解析地名：优先使用国内可用的免费接口（中文、无需 key），失败时回退到 ip-api.com
 * 返回如 "武汉, 湖北, 中国" 或 "Mountain View, California, United States"
 */
const GEO_TIMEOUT_MS = 3000
const LOCALHOST_LABEL = '本地'

/** 国内友好：ip.zhengbingdong.com，无需 key，600 次/分钟，返回中文 */
const GEO_ZHENG = 'https://ip.zhengbingdong.com/v1/get'
/** 备用：ip-api.com，免费非商业，国内可能较慢 */
const GEO_IPAPI = 'http://ip-api.com/json'

async function fetchGeoZhengbingdong(ip: string): Promise<string | null> {
  const url = `${GEO_ZHENG}?ip=${encodeURIComponent(ip)}`
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), GEO_TIMEOUT_MS)
  const res = await fetch(url, { signal: ctrl.signal } as RequestInit)
  clearTimeout(t)
  if (!res.ok) return null
  const json = (await res.json()) as { ret?: number; data?: { city?: string; prov?: string; country?: string } }
  if (json.ret !== 200 || !json.data) return null
  const { city, prov, country } = json.data
  const parts = [city, prov, country].filter(Boolean) as string[]
  return parts.length > 0 ? parts.join(', ') : null
}

async function fetchGeoIpApi(ip: string): Promise<string | null> {
  const url = `${GEO_IPAPI}/${encodeURIComponent(ip)}?fields=country,regionName,city&lang=zh-CN`
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), GEO_TIMEOUT_MS)
  const res = await fetch(url, { signal: ctrl.signal } as RequestInit)
  clearTimeout(t)
  if (!res.ok) return null
  const data = (await res.json()) as { city?: string; regionName?: string; country?: string; message?: string }
  if (data.message) return null
  const parts = [data.city, data.regionName, data.country].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : null
}

export async function resolveIpLocation(ip: string | undefined): Promise<string | null> {
  if (!ip || typeof ip !== 'string') return null
  const trimmed = ip.trim()
  if (!trimmed) return null
  if (trimmed === '::1' || trimmed === '::ffff:127.0.0.1') return LOCALHOST_LABEL
  if (/^127\.|^10\.|^172\.(1[6-9]|2\d|3[01])\.|^192\.168\./.test(trimmed)) return LOCALHOST_LABEL
  const fromZhengbingdong = await fetchGeoZhengbingdong(trimmed).catch(() => null)
  if (fromZhengbingdong) return fromZhengbingdong
  return fetchGeoIpApi(trimmed).catch(() => null) ?? null
}
