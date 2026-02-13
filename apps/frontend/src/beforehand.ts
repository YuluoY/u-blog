import type { App } from 'vue'
import { CLanguage, CTheme } from '@u-blog/model'
import { useAppStore } from './stores/app'
import { useUserStore } from './stores/model/user'

export default async function beforehand(app: App): Promise<void>
{
  void app

  const appStore = useAppStore()
  const userStore = useUserStore()

  appStore.setTheme(CTheme.DEFAULT)
  appStore.setLanguage(CLanguage.ZH)

  await userStore.fetchUser()
}
