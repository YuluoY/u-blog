import { defineStore } from 'pinia'
import { watch } from 'vue'
import { useState } from '@u-blog/composables'
import type { PanelId } from '@/constants/layout'
import { PANEL_ID } from '@/constants/layout'
import { STORAGE_KEYS } from '@/constants/storage'

function loadCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED) === 'true'
  } catch {
    return false
  }
}

function loadActivePanel(): PanelId | null {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.SIDEBAR_ACTIVE_PANEL)
    if (v == null) return PANEL_ID.PROFILE // 从未存过，默认站长信息
    if (v === '') return null // 曾关闭面板
    const valid = Object.values(PANEL_ID) as string[]
    return valid.includes(v) ? (v as PanelId) : PANEL_ID.PROFILE
  } catch {
    return PANEL_ID.PROFILE
  }
}

/** 无激活时“默认打开”的面板：用上次打开过的（lastActivePanel），没有才用第一个 */
function getPreferredPanel(): PanelId {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.SIDEBAR_LAST_ACTIVE_PANEL)
    if (v == null || v === '') return PANEL_ID.PROFILE
    const valid = Object.values(PANEL_ID) as string[]
    return valid.includes(v) ? (v as PanelId) : PANEL_ID.PROFILE
  } catch {
    return PANEL_ID.PROFILE
  }
}

/**
 * 左侧边栏状态：Icon Bar + Side Panel
 * - 非折叠：Panel dock 占位，与 Main 同高
 * - 折叠：仅 Icon Bar，点击面板型 icon 用 Popover 展示
 * - 折叠态与激活面板会持久化到 localStorage
 *
 * 场景与行为（排列组合）：
 * 1. 展开 + 有面板：点折叠 → 取消激活并折叠；点当前/其他 icon → 关闭或切换
 * 2. 展开 + 无面板：点折叠 → 折叠；点 icon → dock 打开该面板
 * 3. 折叠 + 无面板：点折叠 → 展开并打开默认面板（否则展开后 dock 为空）；点 icon → Popover 打开
 * 4. 折叠 + Popover 打开：点折叠 → 展开且面板在 dock 显示；点当前 icon → 关闭；点其他 icon → 切换；点空白(backdrop) → 仅关闭 Popover
 */
export const useSidebarStore = defineStore('sidebar', () =>
{
  /** 是否折叠（折叠后只显示 Icon Bar，面板以 Popover 展示） */
  const [collapsed, setCollapsed] = useState(loadCollapsed())
  /** 当前打开的面板 id，默认用户信息；null 表示无面板 */
  const [activePanel, setActivePanel] = useState<PanelId | null>(loadActivePanel())

  watch(collapsed, (v) => {
    try {
      localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(v))
    } catch { /* ignore */ }
  }, { immediate: true })

  watch(activePanel, (v) => {
    try {
      localStorage.setItem(STORAGE_KEYS.SIDEBAR_ACTIVE_PANEL, v ?? '')
      if (v != null)
        localStorage.setItem(STORAGE_KEYS.SIDEBAR_LAST_ACTIVE_PANEL, v)
    } catch { /* ignore */ }
  }, { immediate: true })

  /**
   * 切换折叠/展开。
   * 展开→折叠：同时取消激活（关闭面板）。
   * 折叠→展开且无激活：用本地缓存的面板，没有才用第一个，避免 dock 空白。
   */
  const toggleCollapsed = () =>
  {
    if (collapsed.value) {
      setCollapsed(false)
      if (activePanel.value == null)
        setActivePanel(getPreferredPanel())
    } else {
      setCollapsed(true)
      setActivePanel(null)
    }
  }

  /**
   * 打开或切换面板（toggle 语义）
   * 同一 id → 关闭；不同 id → 切换到该面板
   */
  const setPanel = (id: PanelId | null) =>
  {
    setActivePanel(activePanel.value === id ? null : id)
  }

  /** 仅关闭面板（如点击 backdrop），不改变折叠态 */
  const closePanel = () =>
  {
    setActivePanel(null)
  }

  return {
    collapsed,
    activePanel,
    setCollapsed,
    setActivePanel: setPanel,
    toggleCollapsed,
    closePanel,
    PANEL_ID,
  }
})
