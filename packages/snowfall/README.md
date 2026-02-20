# @u-blog/snowfall

Vue 3 飘雪插件：全屏顶层飘落雪花，雪花颜色随时间在主题色间循环（随机相位分布），悬停时雪花暂停并显示一句暖心/鼓励文案。无点击等事件，不阻挡页面操作。

## 安装

```bash
pnpm add @u-blog/snowfall
# 或
npm i @u-blog/snowfall
```

## 在 Vite + Vue 3 项目中使用

### 1. 注册插件并引入样式

```ts
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import SnowfallPlugin from '@u-blog/snowfall'
import '@u-blog/snowfall/dist/style.css'

const app = createApp(App)
app.use(SnowfallPlugin)
app.mount('#app')
```

### 2. 在根组件中挂载（最顶层）

```vue
<!-- App.vue -->
<template>
  <YourLayout>
    <RouterView />
  </YourLayout>
  <Snowfall :options="snowfallOptions" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

const snowfallOptions = computed(() => ({
  count: 52,
  zIndex: 9998,
  themeColors: [
    'var(--u-primary)',
    'var(--u-success)',
    'var(--u-warning)',
    'var(--u-danger)',
    'var(--u-info)'
  ],
  messages: ['今天也要开心呀', '你已经做得很好了', '…'] // 可选，覆盖默认暖心文案
}))
</script>
```

## 选项 (SnowfallOptions)

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `count` | number | 48 | 雪花数量 |
| `themeColors` | string[] | 主题色 CSS 变量 | 雪花颜色随时间在这些颜色间循环 |
| `messages` | string[] | 内置 20 条 | 悬停时随机展示的暖心/鼓励文案 |
| `zIndex` | number | 9998 | 飘雪层 z-index |

## 行为说明

- 雪花从顶部下落，速度与延迟随机，颜色按 12s 周期在 `themeColors` 间渐变，每片雪花相位随机，形成「随机平均分布变化主题色」的效果。
- 容器为 `pointer-events: none`，仅雪花本身可悬停；悬停时该片暂停动画并显示一句文案，移开后继续飘落。
- 无点击、拖拽等事件，不阻挡下层页面交互。
