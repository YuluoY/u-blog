import { createApp } from 'vue'
import App from '@/App.vue'
import 'normalize.css'
import '@/assets/styles/index.scss'
import { createPinia } from 'pinia'

import router from '@/router'
import i18n from './locales'
import UccUI from '@u-blog/ui'
import '@u-blog/ui/dist/es/index.css'
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

  // 首屏帘幕打开动画：保证最少展示 1.5s 后再触发上下滑出
  const SPLASH_MIN_DURATION = 1500
  const splashStart = window.__splashStart || Date.now()
  const elapsed = Date.now() - splashStart
  const remaining = Math.max(0, SPLASH_MIN_DURATION - elapsed)

  setTimeout(() => {
    requestAnimationFrame(() => {
      const splash = document.getElementById('splash')
      if (splash) {
        splash.classList.add('open')
        // 帘幕动画结束后彻底移除
        const onEnd = () => { splash.classList.add('done') }
        splash.addEventListener('transitionend', onEnd, { once: true })
        // 兜底：若 transitionend 未触发，1.5s 后强制隐藏
        setTimeout(onEnd, 1500)
      }
    })
  }, remaining)

  if (import.meta.env.DEV) {
    import('@/api/comment').then((m) => {
      window.__debugAddComment = (data) => m.default.addComment(data)
    })
  }
})

export default app
