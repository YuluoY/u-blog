import { createApp } from 'vue'
import App from './App.vue'
import 'normalize.css'
import { useRootFontSize } from '@u-blog/helper'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import{ zhCn } from '@/locale'
import UccUI from '@/core'

// import UccUI, { zhCn } from 'ucc-ui'
// import 'ucc-ui/dist/index.css'

const app = createApp(App)
app.use(ElementPlus)
app.use(UccUI, { locale: zhCn })

useRootFontSize({ immediate: true })

app.mount('#app')