# Badge 徽标

徽标组件，用于显示数字、文本或状态标记。常用于消息提醒、数量显示等场景。

## 基本用法

使用 `value` 属性设置徽标的内容。

```vue
<template>
  <u-badge :value="5">
    <div class="demo-item">徽标内容</div>
  </u-badge>
</template>
```

## 不同类型

Badge 组件提供了多种预设类型，通过 `type` 属性设置。

```vue
<template>
  <u-badge type="primary" :value="1">
    <div class="demo-item">主要</div>
  </u-badge>
  
  <u-badge type="success" :value="2">
    <div class="demo-item">成功</div>
  </u-badge>
  
  <u-badge type="warning" :value="3">
    <div class="demo-item">警告</div>
  </u-badge>
  
  <u-badge type="danger" :value="4">
    <div class="demo-item">危险</div>
  </u-badge>
  
  <u-badge type="info" :value="5">
    <div class="demo-item">信息</div>
  </u-badge>
</template>
```

## 最大值

当 `value` 是数字时，超过 `max` 会显示 `{max}+`。

```vue
<template>
  <u-badge :value="100" :max="99">
    <div class="demo-item">最大值</div>
  </u-badge>
</template>
```

## 自定义颜色

可以通过 `color` 属性设置自定义背景色。

```vue
<template>
  <u-badge :value="6" color="#8e44ad">
    <div class="demo-item">自定义颜色</div>
  </u-badge>
</template>
```

## 小圆点

设置 `is-dot` 属性，展示为一个小圆点。

```vue
<template>
  <u-badge is-dot>
    <div class="demo-item">小圆点</div>
  </u-badge>
</template>
```

## 位置偏移

通过 `offset` 属性设置徽标的位置偏移，数组的两个值分别代表水平和垂直方向的偏移量。

```vue
<template>
  <u-badge :value="7" :offset="[10, 10]">
    <div class="demo-item">位置偏移</div>
  </u-badge>
</template>
```

## 隐藏徽标

通过设置 `hidden` 属性为 `true` 可以隐藏徽标。

```vue
<template>
  <u-badge :value="8" :hidden="true">
    <div class="demo-item">隐藏徽标</div>
  </u-badge>
</template>
```

## 自定义样式

可以通过 `badge-style` 和 `badge-class` 属性自定义徽标的样式。

```vue
<template>
  <u-badge 
    :value="9" 
    :badge-style="{ borderRadius: '4px', padding: '0 6px' }"
    badge-class="custom-badge">
    <div class="demo-item">自定义样式</div>
  </u-badge>
</template>
```

## 属性

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| value | 显示值 | string / number | '' |
| max | 最大值，超过最大值会显示{max}+。只有当value是数字类型时起作用 | number | 99 |
| is-dot | 是否显示小圆点 | boolean | false |
| hidden | 是否隐藏Badge | boolean | false |
| type | badge类型，可选值为 'primary', 'success', 'warning', 'danger', 'info' | string | 'danger' |
| show-zero | 值为0的时候是否显示badge | boolean | true |
| color | 背景色 | string | '' |
| offset | badge的偏移量，数组的两个值分别代表水平和垂直方向的偏移量 | [number, number] | [0, 0] |
| badge-style | 自定义badge样式 | CSSProperties | {} |
| badge-class | 自定义badge类名 | string | '' |

## 类型定义

```ts
// Badge 类型
type UBadgeType = 'primary' | 'success' | 'warning' | 'danger' | 'info';

// Badge 属性接口
interface UBadgeProps {
  value?: string | number;
  max?: number;
  isDot?: boolean;
  hidden?: boolean;
  type?: UBadgeType;
  showZero?: boolean;
  color?: string;
  offset?: [number, number];
  badgeStyle?: CSSProperties;
  badgeClass?: string;
}
``` 