# UIcon 图标组件

UIcon 是一个基于 Font Awesome 的图标组件，提供了丰富的图标选择和样式定制能力，使图标的使用更加简单和灵活。

## 基本用法

```vue
<template>
  <u-icon icon="home" />
  <u-icon :icon="['fas', 'user']" />
  <u-icon icon="fa-solid fa-bell" />
</template>

<script setup>
import { UIcon } from '@ucc-ui/components'
</script>
```

## 图标类型

UIcon 支持多种预设类型，会自动应用对应的颜色样式：

```vue
<template>
  <u-icon icon="check-circle" type="success" />
  <u-icon icon="info-circle" type="info" />
  <u-icon icon="exclamation-circle" type="warning" />
  <u-icon icon="times-circle" type="danger" />
  <u-icon icon="star" type="primary" />
</template>
```

## 图标大小

通过 `size` 属性可以设置图标的大小：

```vue
<template>
  <u-icon icon="home" size="xs" />
  <u-icon icon="home" size="sm" />
  <u-icon icon="home" size="lg" />
  <u-icon icon="home" size="2x" />
  <u-icon icon="home" size="3x" />
</template>
```

## 图标旋转

支持设置图标的旋转角度：

```vue
<template>
  <u-icon icon="arrow-right" rotation="90" />
  <u-icon icon="arrow-right" rotation="180" />
  <u-icon icon="arrow-right" rotation="270" />
</template>
```

## 动画效果

UIcon 支持多种动画效果：

```vue
<template>
  <u-icon icon="spinner" spin />
  <u-icon icon="circle-notch" pulse />
  <u-icon icon="bell" bounce />
  <u-icon icon="heart" beat />
  <u-icon icon="star" fade />
</template>
```

## 自定义颜色

可以通过 `color` 属性直接设置图标颜色：

```vue
<template>
  <u-icon icon="heart" color="#ff6b6b" />
  <u-icon icon="star" color="gold" />
  <u-icon icon="circle" color="rgba(0, 128, 255, 0.7)" />
</template>
```

## 翻转图标

通过 `flip` 属性可以水平或垂直翻转图标：

```vue
<template>
  <u-icon icon="arrow-right" flip="horizontal" />
  <u-icon icon="arrow-up" flip="vertical" />
  <u-icon icon="arrow-right" flip="both" />
</template>
```

## 固定宽度

使用 `fixedWidth` 属性可以让图标保持固定宽度，适合在列表或导航中使用：

```vue
<template>
  <div>
    <div><u-icon icon="home" fixed-width /> 首页</div>
    <div><u-icon icon="user" fixed-width /> 用户</div>
    <div><u-icon icon="cog" fixed-width /> 设置</div>
  </div>
</template>
```

## API

### Props

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| icon | 图标名称，可以是字符串、数组或对象 | string \| Array<string\> \| object \| IconDefinition | - |
| type | 图标类型，会应用预设的颜色样式 | 'success' \| 'warning' \| 'danger' \| 'info' \| 'primary' \| 'default' | - |
| color | 图标颜色，会覆盖 type 的颜色设置 | string | - |
| size | 图标大小 | '2xs' \| 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl' \| '1x' \| '2x' \| '3x' \| '4x' \| '5x' \| '6x' \| '7x' \| '8x' \| '9x' \| '10x' | - |
| rotation | 图标旋转角度 | '90' \| '180' \| '270' \| 90 \| 180 \| 270 | - |
| flip | 图标翻转方向 | 'horizontal' \| 'vertical' \| 'both' | - |
| spin | 是否旋转图标 | boolean | false |
| pulse | 是否使用脉冲旋转动画 | boolean | false |
| border | 是否显示边框 | boolean | false |
| fixedWidth | 是否使用固定宽度 | boolean | false |
| listItem | 是否作为列表项图标 | boolean | false |
| pull | 图标对齐方向 | 'left' \| 'right' | - |
| bounce | 是否使用弹跳动画 | boolean | false |
| shake | 是否使用摇晃动画 | boolean | false |
| fade | 是否使用淡入淡出动画 | boolean | false |
| beatFade | 是否使用心跳淡入淡出动画 | boolean | false |
| spinPulse | 是否使用旋转脉冲动画 | boolean | false |
| spinReverse | 是否反向旋转 | boolean | false |
| transform | 图标变换 | object \| string | - |
| mask | 图标遮罩 | object \| Array<string\> \| string | - |
| symbol | 是否转换为 SVG 符号 | boolean | false |
| title | 图标标题（用于无障碍） | string | - |
| inverse | 是否反转颜色 | boolean | false |

## 注意事项

1. UIcon 组件基于 Font Awesome，使用前需确保已正确安装和配置 Font Awesome 库
2. 使用数组形式的图标名称时，第一个元素是图标前缀（如 'fas'、'far'），第二个元素是图标名称
3. 当同时设置 `type` 和 `color` 属性时，`color` 属性的优先级更高
4. 组件支持所有 Font Awesome 的图标和动画效果 