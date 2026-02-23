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
import '@/assets/styles/md-code-theme.scss'
import SnowfallPlugin from '@u-blog/snowfall'
import '@u-blog/snowfall/dist/style.css'

import beforehand from './beforehand'
import stores from './stores'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(stores)
app.use(router)
app.use(i18n)

// 语言同步统一在 App.vue 的 watch(language) 中完成，此处不再重复

app.use(UccUI)
app.use(SnowfallPlugin)

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
