import { createApp } from 'vue'
import App from './App.vue'
import 'normalize.css'

import { zhCn } from '@/locale'
import UccUI from '@/core'

const app = createApp(App)
app.use(UccUI, { locale: zhCn })

app.mount('#app')
