/**
 * 天气查询服务
 * 使用 wttr.in 免费 API（无需 API Key，支持中文）
 */

const WEATHER_TIMEOUT_MS = 3000

/** 天气缓存，避免同一城市短时间内重复查询，TTL 15 分钟 */
const weatherCache = new Map<string, { data: IWeatherInfo; expireAt: number }>()
const WEATHER_CACHE_TTL = 15 * 60 * 1000

/** 天气信息结构 */
export interface IWeatherInfo {
  /** 地点名称 */
  location: string
  /** 当前温度（摄氏度） */
  temperature: string
  /** 天气状况描述 */
  description: string
  /** 体感温度 */
  feelsLike: string
  /** 湿度 */
  humidity: string
  /** 风速 */
  windSpeed: string
}

/**
 * 根据城市名或 IP 获取天气信息
 * @param query 城市名（中文/英文）或 IP 地址
 */
export async function getWeather(query: string): Promise<IWeatherInfo | null> {
  if (!query || typeof query !== 'string') return null

  const key = query.trim().toLowerCase()
  // 缓存命中则直接返回
  const cached = weatherCache.get(key)
  if (cached && Date.now() < cached.expireAt) return cached.data

  try {
    const encoded = encodeURIComponent(query.trim())
    const url = `https://wttr.in/${encoded}?format=j1&lang=zh`
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), WEATHER_TIMEOUT_MS)

    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'u-blog-backend' },
    } as RequestInit)
    clearTimeout(timer)

    if (!res.ok) return null

    const data = await res.json() as any
    const current = data?.current_condition?.[0]
    const area = data?.nearest_area?.[0]

    if (!current) return null

    // 拼接地点信息
    const areaName = area?.areaName?.[0]?.value || ''
    const region = area?.region?.[0]?.value || ''
    const country = area?.country?.[0]?.value || ''
    const locationParts = [areaName, region, country].filter(Boolean)

    const info: IWeatherInfo = {
      location: locationParts.join(', ') || query,
      temperature: `${current.temp_C}°C`,
      description: current.lang_zh?.[0]?.value || current.weatherDesc?.[0]?.value || '未知',
      feelsLike: `${current.FeelsLikeC}°C`,
      humidity: `${current.humidity}%`,
      windSpeed: `${current.windspeedKmph}km/h`,
    }

    // 写入缓存
    weatherCache.set(key, { data: info, expireAt: Date.now() + WEATHER_CACHE_TTL })
    return info
  } catch {
    return null
  }
}

/**
 * 格式化天气信息为可读文本
 */
export function formatWeather(info: IWeatherInfo): string {
  return `📍 ${info.location}\n🌡️ 温度: ${info.temperature}（体感 ${info.feelsLike}）\n🌤️ 天气: ${info.description}\n💧 湿度: ${info.humidity}\n🌬️ 风速: ${info.windSpeed}`
}
