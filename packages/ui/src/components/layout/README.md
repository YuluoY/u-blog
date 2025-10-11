# Layout 布局

布局组件，提供灵活的页面布局方式，支持多种布局模式和区域划分。

## 基本用法

使用 `<u-layout>` 和 `<u-region>` 组件创建基本布局。

```vue
<template>
  <u-layout>
    <u-region region="top">顶部区域</u-region>
    <u-region region="left">左侧区域</u-region>
    <u-region region="center">中心区域</u-region>
    <u-region region="right">右侧区域</u-region>
    <u-region region="bottom">底部区域</u-region>
  </u-layout>
</template>
```

## 行布局模式

通过 `mode="row"` 设置为行布局模式，可以使用 `span` 属性指定区域所占的列数。

```vue
<template>
  <u-layout mode="row" :max-span="24">
    <u-region :span="6">区域1</u-region>
    <u-region :span="6">区域2</u-region>
    <u-region :span="6">区域3</u-region>
    <u-region :span="6">区域4</u-region>
  </u-layout>
</template>
```

## 列布局模式

通过 `mode="column"` 设置为列布局模式。

```vue
<template>
  <u-layout mode="column">
    <u-region>区域1</u-region>
    <u-region>区域2</u-region>
    <u-region>区域3</u-region>
  </u-layout>
</template>
```

## 区域延伸

通过 `extend` 属性可以设置区域延伸方式，仅在 `mode="default"` 时有效。

```vue
<template>
  <u-layout extend="left">
    <u-region region="top">顶部区域</u-region>
    <u-region region="left">左侧区域</u-region>
    <u-region region="center">中心区域</u-region>
    <u-region region="right">右侧区域</u-region>
    <u-region region="bottom">底部区域</u-region>
  </u-layout>
</template>
```

## 内边距和间距

通过 `padding` 和 `gutter` 属性可以设置布局的内边距和间距。

```vue
<template>
  <u-layout :padding="20" :gutter="10">
    <u-region region="top">顶部区域</u-region>
    <u-region region="left">左侧区域</u-region>
    <u-region region="center">中心区域</u-region>
    <u-region region="right">右侧区域</u-region>
    <u-region region="bottom">底部区域</u-region>
  </u-layout>
</template>
```

## 区域对齐方式

通过 `justify` 和 `align` 属性可以设置区域的水平和垂直对齐方式。

```vue
<template>
  <u-layout>
    <u-region justify="center" align="center">
      居中对齐的内容
    </u-region>
  </u-layout>
</template>
```

## Layout 属性

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| mode | 布局模式 | [LayoutMode](#layout-mode) | 'default' |
| extend | 区域延伸方式，仅在 mode="default" 时有效 | [LayoutExtend](#layout-extend) | - |
| padding | 内边距 | number | - |
| gutter | 间距 | number | - |
| max-span | 最大行块 | number | 24 |

## Region 属性

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| region | 区域类型 | [RegionType](#region-type) | 'center' |
| width | 宽度 | number / string | 'auto' |
| span | 列数 | number | - |
| padding | 内边距 | number | 0 |
| justify | 水平对齐方式 | [FlexAlign](#flex-align) | 'start' |
| align | 垂直对齐方式 | [FlexAlign](#flex-align) | 'start' |

## 类型定义

### <span id="layout-mode">LayoutMode</span>

```ts
type ULayoutMode = 'row' | 'column' | 'default';
```

### <span id="layout-extend">LayoutExtend</span>

```ts
type ULayoutExtend = 'left-top' | 'right-top' | 'left-bottom' | 'right-bottom' | 'left' | 'right' | 'both';
```

### <span id="region-type">RegionType</span>

```ts
type URegionType = 'left' | 'right' | 'top' | 'center' | 'bottom';
```

### <span id="flex-align">FlexAlign</span>

```ts
type ULayoutFlexAlign = 'start' | 'end' | 'center' | 'between' | 'around';
``` 