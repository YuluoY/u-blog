import type { App } from 'vue'
import { useUserStore } from './stores/model/user'

export default async function beforehand(app: App): Promise<void>
{
  void app

  const userStore = useUserStore()

  // 语言同步统一在 App.vue 的 watch(language, immediate: true) 中完成

  await userStore.fetchUser()
}
