# Tooltip 文字提示组件

Tooltip 组件用于在鼠标悬停、点击或聚焦在某个元素上时，显示提示信息。

## 基本用法

```vue
<template>
  <u-tooltip content="这是一个提示文本">
    <button>鼠标悬停查看提示</button>
  </u-tooltip>
</template>
```

## 不同位置

Tooltip 组件支持 12 个不同的位置。

```vue
<template>
  <u-tooltip content="Top 提示文本" placement="top">
    <button>上方</button>
  </u-tooltip>
  
  <u-tooltip content="Bottom 提示文本" placement="bottom">
    <button>下方</button>
  </u-tooltip>
  
  <u-tooltip content="Left 提示文本" placement="left">
    <button>左侧</button>
  </u-tooltip>
  
  <u-tooltip content="Right 提示文本" placement="right">
    <button>右侧</button>
  </u-tooltip>
</template>
```

## 主题

Tooltip 组件提供了两种主题：dark 和 light。

```vue
<template>
  <u-tooltip content="Dark 主题" effect="dark">
    <button>Dark</button>
  </u-tooltip>
  
  <u-tooltip content="Light 主题" effect="light">
    <button>Light</button>
  </u-tooltip>
</template>
```

## 触发方式

Tooltip 组件支持多种触发方式：hover、click、focus 和 contextmenu。

```vue
<template>
  <u-tooltip content="悬停触发" trigger="hover">
    <button>悬停触发</button>
  </u-tooltip>
  
  <u-tooltip content="点击触发" trigger="click">
    <button>点击触发</button>
  </u-tooltip>
  
  <u-tooltip content="聚焦触发" trigger="focus">
    <input placeholder="聚焦触发" />
  </u-tooltip>
  
  <u-tooltip content="右键触发" trigger="contextmenu">
    <button>右键触发</button>
  </u-tooltip>
</template>
```

## 手动控制

可以通过 `visible` 属性和 `manual` 属性手动控制 Tooltip 的显示和隐藏。

```vue
<template>
  <u-tooltip 
    content="手动控制显示" 
    v-model:visible="visible" 
    manual
  >
    <button @click="toggleTooltip">点击切换提示</button>
  </u-tooltip>
</template>

<script setup>
import { ref } from 'vue';

const visible = ref(false);

function toggleTooltip() {
  visible.value = !visible.value;
}
</script>
```

## 自定义内容

可以使用 `content` 插槽自定义 Tooltip 的内容。

```vue
<template>
  <u-tooltip>
    <template #content>
      <div>
        <h4>自定义标题</h4>
        <p>这是一段自定义内容</p>
        <button>点击按钮</button>
      </div>
    </template>
    <button>悬停查看自定义内容</button>
  </u-tooltip>
</template>
```

## 过渡动画

可以通过 `transition` 属性自定义过渡动画。

```vue
<template>
  <u-tooltip content="自定义过渡动画" transition="fade-bounce">
    <button>悬停查看动画效果</button>
  </u-tooltip>
</template>

<style>
.fade-bounce-enter-active,
.fade-bounce-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.fade-bounce-enter-from,
.fade-bounce-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
```

## 属性

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| appendTo | 指定 Tooltip 挂载的 DOM 节点 | string / HTMLElement | - |
| effect | 提示框主题 | [UTooltipEffect](#utooltipeffect) | 'dark' |
| content | 提示内容 | string | - |
| rawContent | 是否使用原生 html | boolean | false |
| placement | 弹出位置 | [Placement](#placement) | 'bottom' |
| visible | 是否显示 | boolean | false |
| disabled | 是否禁用 | boolean | false |
| offset | 偏移量 | number | - |
| showTimeout | 延迟显示，单位为毫秒 | number | 0 |
| hideTimeout | 延迟关闭，单位为毫秒 | number | 300 |
| showArrow | 是否显示箭头 | boolean | true |
| autoCloseTimeout | 自动关闭时间，单位为毫秒 | number | - |
| popperClass | 给 Tooltip 的 popper 添加类名 | string | - |
| popperOptions | popper.js 的配置项 | [PopperOptions](#popperoptions) | {} |
| trigger | 触发方式 | [UTooltipTrigger](#utooltiptrigger) | 'hover' |
| virtualTriggering | 是否使用虚拟触发器 | boolean | false |
| virtualRef | 虚拟触发器 | Ref\<HTMLElement\> / HTMLElement / null | - |
| triggerKeys | 触发器键值 | string[] | - |
| persistent | 是否持久显示 | boolean | false |
| ariaLabel | 提示框的 aria-label 属性 | string | - |
| transition | 过渡动画 | string | 'fade' |
| manual | 是否手动控制显示状态 | boolean | false |
| width | 宽度 | number | 200 |
| padding | 内边距 | number | 14 |
| transitionProps | 过渡动画属性 | Record<string, any> | - |

## 事件

| 事件名 | 说明 | 参数 |
| --- | --- | --- |
| visible-change | 显示状态改变时触发 | (value: boolean) |
| click-outside | 点击外部时触发 | - |
| update:visible | 显示状态改变时触发 | (value: boolean) |

## 插槽

| 插槽名 | 说明 |
| --- | --- |
| default | 触发 Tooltip 显示的元素 |
| content | 自定义 Tooltip 内容 |

## 方法

| 方法名 | 说明 | 参数 |
| --- | --- | --- |
| updatePopper | 更新 popper 位置 | - |
| onOpen | 打开 tooltip | (evt?: Event) |
| onClose | 关闭 tooltip | (evt?: Event) |
| hide | 隐藏 tooltip | (evt?: Event) |

## 类型定义

### UTooltipEffect

提示框主题。

```ts
type UTooltipEffect = 'dark' | 'light';
```

### UTooltipTrigger

触发方式。

```ts
type UTooltipTrigger = 'hover' | 'click' | 'focus' | 'contextmenu';
```

### Placement

弹出位置，来自 @popperjs/core。

```ts
type Placement = 'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end' | 'left' | 'left-start' | 'left-end' | 'right' | 'right-start' | 'right-end';
```

### PopperOptions

popper.js 的配置项，详细配置请参考 [popper.js 文档](https://popper.js.org/docs/v2/)。

```ts
interface PopperOptions {
  placement?: Placement;
  modifiers?: Array<{
    name: string;
    options?: Record<string, any>;
  }>;
  strategy?: 'absolute' | 'fixed';
  onFirstUpdate?: (state: {
    placement: Placement;
    options: PopperOptions;
    attributes: Record<string, any>;
    styles: Record<string, any>;
  }) => void;
}
``` 