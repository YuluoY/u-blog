import type { App } from 'vue'
import { useAppStore } from './stores/app'
import { useUserStore } from './stores/model/user'
import { i18n } from './locales'

export default async function beforehand(app: App): Promise<void>
{
  void app

  const appStore = useAppStore()
  const userStore = useUserStore()

  // 语言：store 已从 localStorage 初始化，同步到 i18n（legacy: false 时 locale 为 ref）
  if (appStore.language) {
    i18n.global.locale.value = appStore.language
  }

  await userStore.fetchUser()
}
