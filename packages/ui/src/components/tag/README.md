# Tag 标签组件

标签组件用于标记和选择，可用于标记事物的属性和维度，同时也支持可移除的标签。

## 基本用法

```vue
<template>
  <u-tag>标签一</u-tag>
  <u-tag type="success">标签二</u-tag>
  <u-tag type="warning">标签三</u-tag>
  <u-tag type="danger">标签四</u-tag>
  <u-tag type="info">标签五</u-tag>
</template>
```

## 不同尺寸

```vue
<template>
  <u-tag size="small">小型标签</u-tag>
  <u-tag>默认标签</u-tag>
  <u-tag size="large">大型标签</u-tag>
</template>
```

## 不同主题

```vue
<template>
  <u-tag effect="dark">深色</u-tag>
  <u-tag effect="light">浅色</u-tag>
  <u-tag effect="plain">朴素</u-tag>
</template>
```

## 可关闭标签

```vue
<template>
  <u-tag closable @close="handleClose">可关闭标签</u-tag>
</template>

<script setup>
const handleClose = (event) => {
  console.log('标签被关闭了');
};
</script>
```

## 自定义关闭按钮位置

```vue
<template>
  <u-tag closable close-position="left">左侧关闭按钮</u-tag>
  <u-tag closable close-position="right">右侧关闭按钮</u-tag>
</template>
```

## 圆角标签

```vue
<template>
  <u-tag round>圆角标签</u-tag>
</template>
```

## 带边框标签

```vue
<template>
  <u-tag border>带边框标签</u-tag>
</template>
```

## 自定义颜色

```vue
<template>
  <u-tag color="#f50">自定义颜色标签</u-tag>
  <u-tag color="#2db7f5">自定义颜色标签</u-tag>
  <u-tag color="#87d068">自定义颜色标签</u-tag>
</template>
```

## 属性

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| type | 标签类型 | [UTagType](#utagtype) | 'primary' |
| size | 标签尺寸 | [UTagSize](#utagsize) | 'default' |
| effect | 标签主题 | [UTagEffect](#utageffect) | 'plain' |
| closable | 是否可关闭 | boolean | false |
| border | 是否有边框 | boolean | false |
| color | 自定义背景颜色 | string | — |
| textColor | 自定义文字颜色 | string | — |
| round | 是否为圆角标签 | boolean | false |
| transition | 是否使用过渡动画 | boolean | true |
| closePosition | 关闭按钮位置 | [UTagClosePosition](#utagcloseposition) | 'default' |
| triggerClick | 点击关闭按钮时是否同时触发 click 事件 | boolean | false |

## 事件

| 事件名 | 说明 | 参数 |
| --- | --- | --- |
| close | 关闭标签时触发 | (event: MouseEvent) |
| click | 点击标签时触发 | (event: MouseEvent) |

## 插槽

| 插槽名 | 说明 |
| --- | --- |
| default | 标签内容 |

## 类型定义

### UTagType

标签类型，用于定义标签的颜色样式。

```ts
type UTagType = 'primary' | 'success' | 'warning' | 'danger' | 'info';
```

### UTagSize

标签尺寸，用于定义标签的大小。

```ts
type UTagSize = 'small' | 'default' | 'large';
```

### UTagEffect

标签主题，用于定义标签的外观效果。

```ts
type UTagEffect = 'dark' | 'light' | 'plain';
```

### UTagClosePosition

关闭按钮位置，用于定义关闭按钮在标签中的位置。

```ts
type UTagClosePosition = 'left' | 'right' | 'default';
``` 