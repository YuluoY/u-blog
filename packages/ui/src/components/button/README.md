# Button 按钮

按钮组件，用于触发操作和事件。

## 基本用法

```vue
<template>
  <u-button>默认按钮</u-button>
  <u-button type="primary">主要按钮</u-button>
  <u-button type="success">成功按钮</u-button>
  <u-button type="warning">警告按钮</u-button>
  <u-button type="danger">危险按钮</u-button>
  <u-button type="info">信息按钮</u-button>
</template>
```

## 朴素按钮

通过 `plain` 属性可以设置为朴素按钮。

```vue
<template>
  <u-button plain>朴素按钮</u-button>
  <u-button type="primary" plain>主要按钮</u-button>
  <u-button type="success" plain>成功按钮</u-button>
  <u-button type="warning" plain>警告按钮</u-button>
  <u-button type="danger" plain>危险按钮</u-button>
  <u-button type="info" plain>信息按钮</u-button>
</template>
```

## 圆角按钮

通过 `round` 属性可以设置为圆角按钮。

```vue
<template>
  <u-button round>圆角按钮</u-button>
  <u-button type="primary" round>主要按钮</u-button>
  <u-button type="success" round>成功按钮</u-button>
  <u-button type="warning" round>警告按钮</u-button>
  <u-button type="danger" round>危险按钮</u-button>
  <u-button type="info" round>信息按钮</u-button>
</template>
```

## 圆形按钮

通过 `circle` 属性可以设置为圆形按钮。

```vue
<template>
  <u-button circle icon="search"></u-button>
  <u-button type="primary" circle icon="edit"></u-button>
  <u-button type="success" circle icon="check"></u-button>
  <u-button type="warning" circle icon="message"></u-button>
  <u-button type="danger" circle icon="delete"></u-button>
  <u-button type="info" circle icon="info"></u-button>
</template>
```

## 禁用状态

通过 `disabled` 属性可以设置按钮为禁用状态。

```vue
<template>
  <u-button disabled>禁用按钮</u-button>
  <u-button type="primary" disabled>主要按钮</u-button>
  <u-button type="success" disabled>成功按钮</u-button>
  <u-button type="warning" disabled>警告按钮</u-button>
  <u-button type="danger" disabled>危险按钮</u-button>
  <u-button type="info" disabled>信息按钮</u-button>
</template>
```

## 图标按钮

通过 `icon` 属性可以设置按钮的图标，通过 `icon-position` 属性可以设置图标的位置。

```vue
<template>
  <u-button icon="search">搜索</u-button>
  <u-button icon="edit" icon-position="right">编辑</u-button>
</template>
```

## 加载状态

通过 `loading` 属性可以设置按钮为加载状态。

```vue
<template>
  <u-button loading>加载中</u-button>
  <u-button type="primary" loading>加载中</u-button>
  <u-button type="success" loading loading-icon="spinner">自定义图标</u-button>
</template>
```

## 按钮尺寸

通过 `size` 属性可以设置按钮的尺寸。

```vue
<template>
  <u-button size="large">大型按钮</u-button>
  <u-button>默认按钮</u-button>
  <u-button size="small">小型按钮</u-button>
</template>
```

## 自定义颜色

通过 `color` 属性可以自定义按钮的颜色。

```vue
<template>
  <u-button color="#8e44ad">自定义颜色</u-button>
  <u-button color="#16a085" plain>自定义颜色</u-button>
</template>
```

## 按钮组

使用 `<u-button-group>` 标签可以将多个按钮组合在一起。

```vue
<template>
  <u-button-group>
    <u-button type="primary" icon="arrow-left">上一页</u-button>
    <u-button type="primary">中间</u-button>
    <u-button type="primary" icon="arrow-right" icon-position="right">下一页</u-button>
  </u-button-group>
</template>
```

## 节流与防抖

通过 `use-throttle` 和 `use-debounce` 属性可以设置按钮的点击事件为节流或防抖模式。

```vue
<template>
  <u-button use-throttle :throttle-time="500" @click="handleClick">节流按钮</u-button>
  <u-button use-debounce :debounce-time="500" @click="handleClick">防抖按钮</u-button>
</template>

<script setup>
const handleClick = () => {
  console.log('按钮被点击了')
}
</script>
```

## 属性

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| type | 按钮类型 | 'primary' \| 'success' \| 'warning' \| 'danger' \| 'info' \| 'link' | - |
| size | 按钮尺寸 | 'large' \| 'default' \| 'small' | 'default' |
| plain | 是否为朴素按钮 | boolean | false |
| round | 是否为圆角按钮 | boolean \| number | false |
| circle | 是否为圆形按钮 | boolean | false |
| link | 是否为链接按钮 | boolean | false |
| disabled | 是否禁用 | boolean | false |
| loading | 是否加载中 | boolean | false |
| loading-icon | 加载图标 | string | 'spinner' |
| icon | 图标 | string | - |
| icon-position | 图标位置 | 'left' \| 'right' | 'left' |
| icon-style | 图标样式 | CSSProperties | - |
| icon-props | 图标属性 | [IconProps](#icon-props) | - |
| color | 按钮颜色 | string | - |
| autofocus | 是否自动获取焦点 | boolean | false |
| native-type | 原生按钮类型 | 'button' \| 'submit' \| 'reset' | 'button' |
| tag | 自定义元素标签 | string | 'button' |
| use-throttle | 是否使用节流 | boolean | false |
| throttle-time | 节流时间(ms) | number | 400 |
| use-debounce | 是否使用防抖 | boolean | false |
| debounce-time | 防抖时间(ms) | number | 400 |

## 事件

| 事件名 | 说明 | 参数 |
| --- | --- | --- |
| click | 点击按钮时触发 | (event: MouseEvent) |

## 插槽

| 插槽名 | 说明 |
| --- | --- |
| default | 按钮内容 |

## 类型定义

### <span id="icon-props">IconProps</span>

```ts
interface UIconProps {
  icon: string;
  size?: string | number;
  color?: string;
  spin?: boolean;
  // 其他图标属性...
}
``` 