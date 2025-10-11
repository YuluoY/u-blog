# Top 回到顶部组件

Top 组件提供了一个可自定义的回到顶部按钮，当页面滚动超过指定阈值时显示，点击后可以平滑滚动回页面顶部。

## 基本用法

```vue
<template>
  <u-top />
</template>
```

## 自定义位置

可以设置按钮在页面的位置（左下角或右下角）以及距离边缘的偏移量。

```vue
<template>
  <u-top position="left" :offset="100" />
</template>
```

## 自定义大小

可以通过 `size` 属性设置按钮的大小。

```vue
<template>
  <u-top :size="60" />
</template>
```

## 自定义滚动阈值

可以设置页面滚动多少距离后显示按钮，支持像素值或百分比。

```vue
<template>
  <!-- 滚动 200px 后显示 -->
  <u-top :scroll-threshold="200" />
  
  <!-- 滚动页面 30% 后显示 -->
  <u-top scroll-threshold="30%" />
</template>
```

## 自定义内容

可以通过默认插槽自定义按钮的内容。

```vue
<template>
  <u-top>
    <div class="custom-top-button">
      <u-icon name="arrow-up" />
      <span>顶部</span>
    </div>
  </u-top>
</template>
```

## 手动控制

可以通过 `v-model` 手动控制按钮的显示和隐藏。

```vue
<template>
  <u-top v-model="showTop" />
  <u-button @click="showTop = !showTop">切换显示</u-button>
</template>

<script setup>
import { ref } from 'vue';

const showTop = ref(false);
</script>
```

## 自定义动画

可以通过 `animation-class` 属性自定义过渡动画。

```vue
<template>
  <u-top animation-class="fade" />
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
```

## 自定义容器

默认情况下，Top 组件监听整个页面的滚动，但也可以指定特定的容器。

```vue
<template>
  <div id="scroll-container" style="height: 300px; overflow: auto;">
    <div style="height: 1000px;">
      <!-- 内容 -->
    </div>
    <u-top append-to="#scroll-container" />
  </div>
</template>
```

## 属性

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| modelValue / v-model | 是否显示回到顶部按钮 | boolean | false |
| appendTo | 指定组件挂载的 DOM 节点 | string | 'body' |
| size | 按钮大小（像素） | number | 40 |
| position | 按钮位置 | [UTopPosition](#utopposition) | 'right' |
| offset | 按钮偏移量（像素） | number | 50 |
| animationClass | 过渡动画类名 | string | 'u-top-slide' |
| scrollThreshold | 滚动条距离顶部多少时显示按钮 | number / string | '50%' |
| duration | 滚动动画时长（毫秒） | number | 500 |

## 事件

| 事件名 | 说明 | 参数 |
| --- | --- | --- |
| update:modelValue | 按钮显示状态变化时触发 | (value: boolean) |
| click | 点击按钮时触发 | (event: Event) |

## 方法

| 方法名 | 说明 | 参数 |
| --- | --- | --- |
| show | 显示回到顶部按钮 | - |
| hide | 隐藏回到顶部按钮 | - |
| toggle | 切换回到顶部按钮的显示状态 | - |
| vaildate | 校验是否显示按钮 | - |
| scrollTo | 滚动到指定位置 | (position: number, duration?: number) |
| scrollToTop | 滚动到顶部 | (duration?: number) |
| scrollToBottom | 滚动到底部 | (duration?: number) |
| scrollToElement | 滚动到指定元素 | (element: HTMLElement, duration?: number) |

## 插槽

| 插槽名 | 说明 |
| --- | --- |
| default | 自定义按钮内容，默认显示 "TOP" |

## 类型定义

### UTopPosition

按钮位置，用于定义按钮在页面中的位置。

```ts
type UTopPosition = 'left' | 'right';
```

## 高级用法

### 滚动到特定元素

除了回到顶部，Top 组件还提供了滚动到特定元素的功能。

```vue
<template>
  <div>
    <u-button @click="scrollToSection">滚动到章节</u-button>
    <div style="height: 1000px;"></div>
    <div ref="sectionRef">目标章节</div>
    <u-top ref="topRef" />
  </div>
</template>

<script setup>
import { ref } from 'vue';

const sectionRef = ref(null);
const topRef = ref(null);

function scrollToSection() {
  if (sectionRef.value && topRef.value) {
    topRef.value.scrollToElement(sectionRef.value);
  }
}
</script>
```

### 自定义滚动行为

可以通过组件暴露的方法自定义滚动行为。

```vue
<template>
  <div>
    <u-button @click="scrollToMiddle">滚动到中间</u-button>
    <div style="height: 2000px;"></div>
    <u-top ref="topRef" />
  </div>
</template>

<script setup>
import { ref } from 'vue';

const topRef = ref(null);

function scrollToMiddle() {
  if (topRef.value) {
    // 滚动到页面高度的一半
    const halfHeight = document.documentElement.scrollHeight / 2;
    topRef.value.scrollTo(halfHeight, 800); // 使用较长的动画时间
  }
}
</script>
``` 