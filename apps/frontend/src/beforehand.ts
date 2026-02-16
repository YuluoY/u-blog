import type { App } from 'vue'
import { CLanguage } from '@u-blog/model'
import { useAppStore } from './stores/app'
import { useUserStore } from './stores/model/user'

export default async function beforehand(app: App): Promise<void>
{
  void app

  const appStore = useAppStore()
  const userStore = useUserStore()

  // 主题由 store 初始化时从 localStorage 读取并回显，此处不再覆盖
  appStore.setLanguage(CLanguage.ZH)

  await userStore.fetchUser()
}
