import { createApp } from 'vue'
import App from '@/App.vue'
import 'animate.css'
import 'normalize.css'
import '@/assets/styles/index.scss'
import { createPinia } from 'pinia'

import router from '@/router'
import i18n from './locales/index'
import UccUI from '@u-blog/ui'
import '@u-blog/ui/dist/es/index.css'

import beforehand from './beforehand'
import stores from './stores'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(stores)
app.use(router)
app.use(i18n)
app.use(UccUI)

beforehand(app).then(() =>
{
  app.mount('#app')
})

export default app
