/**
 * 免费接口：IP 定位 + 当日天气是否下雪（用于飘雪插件自动模式）
 * - 定位：ip-api.com（免费，无需 key）
 * - 天气：Open-Meteo（免费，无需 key），WMO 雪类天气码 71,73,75,77,85,86
 */

const IP_API = 'https://ip-api.com/json/?fields=lat,lon,status'
const OPEN_METEO = 'https://api.open-meteo.com/v1/forecast'

const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86])

export interface LocationResult {
  lat: number
  lon: number
}

export async function getLocationByIP(): Promise<LocationResult | null> {
  try {
    const res = await fetch(IP_API, { signal: AbortSignal.timeout(5000) })
    const data = await res.json()
    if (data?.status !== 'success' || typeof data?.lat !== 'number' || typeof data?.lon !== 'number') return null
    return { lat: data.lat, lon: data.lon }
  } catch {
    return null
  }
}

/**
 * 查询某地当日是否有雪（按当地日期）
 */
export async function getTodayHasSnow(lat: number, lon: number): Promise<boolean> {
  try {
    const url = `${OPEN_METEO}?latitude=${lat}&longitude=${lon}&daily=weathercode&timezone=auto`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    const data = await res.json()
    const codes: number[] = data?.daily?.weathercode
    const times: string[] = data?.daily?.time
    if (!Array.isArray(codes) || !Array.isArray(times) || codes.length === 0) return false
    const today = new Date().toISOString().slice(0, 10)
    const idx = times.indexOf(today)
    if (idx === -1) return false
    return SNOW_CODES.has(Number(codes[idx]))
  } catch {
    return false
  }
}

const CACHE_KEY = 'snowfall-today-snow'
const CACHE_DATE_KEY = 'snowfall-cache-date'

/**
 * 根据 IP 定位判断当日是否下雪，结果按日期缓存到 sessionStorage，同一天不重复请求
 */
export async function fetchTodayHasSnowByIP(): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10)
  try {
    const cached = sessionStorage.getItem(CACHE_DATE_KEY)
    if (cached === today) {
      return sessionStorage.getItem(CACHE_KEY) === '1'
    }
  } catch { /* ignore */ }

  const loc = await getLocationByIP()
  if (!loc) return false
  const hasSnow = await getTodayHasSnow(loc.lat, loc.lon)
  try {
    sessionStorage.setItem(CACHE_DATE_KEY, today)
    sessionStorage.setItem(CACHE_KEY, hasSnow ? '1' : '0')
  } catch { /* ignore */ }
  return hasSnow
}
