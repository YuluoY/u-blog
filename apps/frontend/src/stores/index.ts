import { useAppStore } from './app'
import { useHeaderStore } from './header'
import { useFooterStore } from './footer'

import type { App } from 'vue'

const getStore = () => {
  return {
    app: useAppStore(),
    header: useHeaderStore(),
    footer: useFooterStore()
  }
}

export type IStore = ReturnType<typeof getStore>

export default {
  install(app: App)
  {
    const store = reactive(getStore())
    if (import.meta.env.DEV)
      window.$u = store
  }
}
