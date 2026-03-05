import { useState } from '@u-blog/composables'
import { defineStore } from 'pinia'
import { getSettings, type SettingsMap } from '@/api/settings'
import { SETTING_KEYS } from '@/constants/settings'

/** 从设置值中提取标量字符串 */
function toStr(v: unknown, fallback: string): string
{
  if (v == null) return fallback
  if (typeof v === 'object' && 'value' in (v as any)) return String((v as any).value ?? fallback)
  return String(v ?? fallback)
}

/** 从设置值中提取布尔值 */
function toBool(v: unknown, fallback: boolean): boolean
{
  if (v == null) return fallback
  const raw = typeof v === 'object' && 'value' in (v as any) ? (v as any).value : v
  if (typeof raw === 'boolean') return raw
  return String(raw) === 'true'
}

export const useFooterStore = defineStore('footer', () =>
{
  const [height, setHeight] = useState(48)
  const [siteYear, setSiteYear] = useState(new Date().getFullYear())
  const [icp, setIcp] = useState('粤ICP备2025000000号')
  const [icpLink, setIcpLink] = useState('https://beian.miit.gov.cn/')
  const [icpVisible, setIcpVisible] = useState(true)
  const [moeIcp, setMoeIcp] = useState('萌ICP备20261027号')
  const [moeIcpLink, setMoeIcpLink] = useState('https://icp.gov.moe/?keyword=20261027')
  const [moeIcpVisible, setMoeIcpVisible] = useState(true)
  const [author, setAuthor] = useState('Eric Hu')
  const [timestamp, setTimestamp] = useState(new Date().getTime())
  const [loaded, setLoaded] = useState(false)

  const interval = setInterval(() =>
  {
    setTimestamp(new Date().getTime())
  }, 1000)

  /** 将 settings map 写入 footer 状态 */
  function _applySettings(map: SettingsMap)
  {
    if (map[SETTING_KEYS.FOOTER_ICP_NUMBER]) setIcp(toStr(map[SETTING_KEYS.FOOTER_ICP_NUMBER], icp.value))
    if (map[SETTING_KEYS.FOOTER_ICP_LINK]) setIcpLink(toStr(map[SETTING_KEYS.FOOTER_ICP_LINK], icpLink.value))
    if (map[SETTING_KEYS.FOOTER_ICP_VISIBLE]) setIcpVisible(toBool(map[SETTING_KEYS.FOOTER_ICP_VISIBLE], true))
    if (map[SETTING_KEYS.FOOTER_MOE_ICP_NUMBER]) setMoeIcp(toStr(map[SETTING_KEYS.FOOTER_MOE_ICP_NUMBER], moeIcp.value))
    if (map[SETTING_KEYS.FOOTER_MOE_ICP_LINK]) setMoeIcpLink(toStr(map[SETTING_KEYS.FOOTER_MOE_ICP_LINK], moeIcpLink.value))
    if (map[SETTING_KEYS.FOOTER_MOE_ICP_VISIBLE]) setMoeIcpVisible(toBool(map[SETTING_KEYS.FOOTER_MOE_ICP_VISIBLE], true))
    if (map[SETTING_KEYS.FOOTER_AUTHOR]) setAuthor(toStr(map[SETTING_KEYS.FOOTER_AUTHOR], author.value))
    setLoaded(true)
  }

  /** 从 App.vue 统一请求的 settings 数据中提取 footer 配置（避免二次请求） */
  function hydrateFromSettings(map: SettingsMap)
  {
    _applySettings(map)
  }

  /** 从后端设置表加载 footer 配置 */
  async function fetchFooterSettings()
  {
    try
    {
      const map = await getSettings([
        SETTING_KEYS.FOOTER_ICP_NUMBER,
        SETTING_KEYS.FOOTER_ICP_LINK,
        SETTING_KEYS.FOOTER_ICP_VISIBLE,
        SETTING_KEYS.FOOTER_MOE_ICP_NUMBER,
        SETTING_KEYS.FOOTER_MOE_ICP_LINK,
        SETTING_KEYS.FOOTER_MOE_ICP_VISIBLE,
        SETTING_KEYS.FOOTER_AUTHOR,
      ])
      _applySettings(map)
    }
    catch
    {
      // 后端不可用时使用默认值
    }
    finally
    {
      setLoaded(true)
    }
  }

  return {
    height,
    siteYear,
    icp,
    icpLink,
    icpVisible,
    moeIcp,
    moeIcpLink,
    moeIcpVisible,
    author,
    timestamp,
    loaded,
    setHeight,
    setSiteYear,
    setIcp,
    setIcpLink,
    setIcpVisible,
    setMoeIcp,
    setMoeIcpLink,
    setMoeIcpVisible,
    setAuthor,
    fetchFooterSettings,
    hydrateFromSettings,
  }
})