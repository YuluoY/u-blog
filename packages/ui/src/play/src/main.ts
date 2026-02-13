import { createApp } from 'vue'
import App from './App.vue'
import 'normalize.css'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import{ zhCn } from '@/locale'
import UccUI from '@/core'

// import UccUI, { zhCn } from 'ucc-ui'
// import 'ucc-ui/dist/index.css'

const app = createApp(App)
app.use(ElementPlus)
app.use(UccUI, { locale: zhCn })

app.mount('#app')
