import { createApp } from 'vue'
import App from '@/App.vue'
import 'animate.css'
import 'normalize.css'
import '@/assets/styles/index.scss'
import { createPinia } from 'pinia'

import router from '@/router'
import i18n from './locales'
import UccUI from '@u-blog/ui'
import '@u-blog/ui/dist/es/index.css'

import beforehand from './beforehand'
import stores from './stores'
import { useAppStore } from './stores/app'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(stores)
app.use(router)
app.use(i18n)

// 启动时把本地存储的语言同步到 i18n，保证首屏与切换后文案一致
const appStore = useAppStore()
if (appStore.language) {
  i18n.global.locale.value = appStore.language
}

app.use(UccUI)

beforehand(app).then(() =>
{
  app.mount('#app')
  if (import.meta.env.DEV) {
    import('@/api/comment').then((m) => {
      window.__debugAddComment = (data) => m.default.addComment(data)
    })
  }
})

export default app
