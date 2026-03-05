/**
 * 游客/普通用户查看后台的共用逻辑
 * 根据后台 GUEST_ADMIN_VIEW_ENABLED 设置决定是否显示入口按钮
 * Admin / Super Admin 角色不显示（已有直接入口）
 */
import { ref, computed, onMounted } from 'vue'
import { getSettings } from '@/api/settings'
import { SETTING_KEYS } from '@/constants/settings'
import { useUserStore } from '@/stores/model/user'

/** 管理后台 URL（与 HeadNav 保持一致） */
const ADMIN_URL =
  import.meta.env.VITE_ADMIN_URL ||
  (import.meta.env.PROD ? '/admin/' : 'http://localhost:5174')

/** 模块级缓存，避免多组件重复请求同一设置 */
let cachedEnabled: boolean | null = null

export function useGuestAdmin()
{
  const userStore = useUserStore()
  const settingEnabled = ref(false)

  /** 当前用户是否为已登录的 admin / super_admin（未登录时 user 存储的是博主信息，不算 admin） */
  const isAdmin = computed(() =>
  {
    if (!userStore.isLoggedIn) return false
    const role = userStore.user?.role
    return role === 'admin' || role === 'super_admin'
  })

  /** 最终是否显示"查看后台"按钮：设置开启 && 非管理员 */
  const visible = computed(() => settingEnabled.value && !isAdmin.value)

  /** 挂载时获取后台设置 */
  onMounted(async() =>
  {
    // 优先使用缓存
    if (cachedEnabled !== null)
    {
      settingEnabled.value = cachedEnabled
      return
    }
    try
    {
      const map = await getSettings([SETTING_KEYS.GUEST_ADMIN_VIEW_ENABLED])
      const raw = map[SETTING_KEYS.GUEST_ADMIN_VIEW_ENABLED]
      const val = raw?.value
      let enabled = false
      if (val === true || val === 'true')
      
        enabled = true
      
      else if (val && typeof val === 'object' && 'value' in val)
      {
        const inner = (val as any).value
        enabled = inner === true || inner === 'true'
      }
      cachedEnabled = enabled
      settingEnabled.value = enabled
    }
    catch
    {
      // 请求失败不显示
    }
  })

  /** 以游客身份打开后台（只读模式） */
  function openAdmin()
  {
    const url = ADMIN_URL.endsWith('/')
      ? `${ADMIN_URL}?guest=1`
      : `${ADMIN_URL}/?guest=1`
    window.open(url, '_blank')
  }

  return { visible, openAdmin }
}
