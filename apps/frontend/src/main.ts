import { createApp } from 'vue'
import App from '@/App.vue'
import 'normalize.css'
import '@/assets/styles/index.scss'
import { createPinia } from 'pinia'
import { config as mdEditorConfig } from 'md-editor-v3'

import router from '@/router'

// md-editor-v3 全局配置
mdEditorConfig({
  markdownItConfig(md)
  {
    // 单个换行符渲染为 <br>，使预览区换行与编辑区一致
    md.set({ breaks: true })

    // 文章内链接在新标签页打开
    const defaultRender = md.renderer.rules.link_open
      || ((tokens: any[], idx: number, options: any, _env: any, self: any) => self.renderToken(tokens, idx, options))

    md.renderer.rules.link_open = (tokens: any[], idx: number, options: any, env: any, self: any) =>
    {
      const token = tokens[idx]
      token.attrSet('target', '_blank')
      token.attrSet('rel', 'noopener noreferrer')
      return defaultRender(tokens, idx, options, env, self)
    }
  },
})
import i18n from './locales'
import UccUI from './plugins/ui'
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
app.use(UccUI)

// 语言同步统一在 App.vue 的 watch(language) 中完成，此处不再重复

app.use(SnowfallPlugin)

beforehand(app).then(() =>
{
  app.mount('#app')

  // 首屏帘幕打开动画：保证最少展示 1.5s 后再触发上下滑出
  const SPLASH_MIN_DURATION = 1500
  const splashStart = window.__splashStart || Date.now()
  const elapsed = Date.now() - splashStart
  const remaining = Math.max(0, SPLASH_MIN_DURATION - elapsed)

  setTimeout(() =>
  {
    requestAnimationFrame(() =>
    {
      const splash = document.getElementById('splash')
      if (splash)
      {
        splash.classList.add('open')
        // 帘幕动画结束后彻底移除
        const onEnd = () =>
        {
          splash.classList.add('done')
        }
        splash.addEventListener('transitionend', onEnd, { once: true })
        // 兜底：若 transitionend 未触发，1.5s 后强制隐藏
        setTimeout(onEnd, 1500)
      }
    })
  }, remaining)

  if (import.meta.env.DEV)
  {
    import('@/api/comment').then(m =>
    {
      window.__debugAddComment = data => m.default.addComment(data)
    })
  }
})

export default app
