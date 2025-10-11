# Text 文本组件

文本组件用于展示各种文本内容，支持不同类型、大小的文本显示，以及文本省略和多行限制等功能。

## 基本用法

```vue
<template>
  <u-text>默认文本</u-text>
  <u-text type="primary">主要文本</u-text>
  <u-text type="success">成功文本</u-text>
  <u-text type="warning">警告文本</u-text>
  <u-text type="danger">危险文本</u-text>
  <u-text type="info">信息文本</u-text>
</template>
```

## 不同尺寸

```vue
<template>
  <u-text size="small">小号文本</u-text>
  <u-text>默认大小文本</u-text>
  <u-text size="large">大号文本</u-text>
</template>
```

## 文本省略

当文本内容过长时，可以使用省略功能。

```vue
<template>
  <div style="width: 200px;">
    <u-text ellipsis>这是一段很长的文本，当文本超出容器宽度时会自动省略显示...</u-text>
  </div>
</template>
```

## 多行文本省略

可以指定最大行数，超出的部分将被省略。

```vue
<template>
  <div style="width: 200px;">
    <u-text :max-line="2">这是一段很长的文本，当文本超出指定的行数时会自动省略显示。这是一段很长的文本，当文本超出指定的行数时会自动省略显示。</u-text>
  </div>
</template>
```

## 自定义标签

可以自定义渲染的 HTML 标签。

```vue
<template>
  <u-text tag="div">使用 div 标签渲染</u-text>
  <u-text tag="p">使用 p 标签渲染</u-text>
  <u-text tag="h1">使用 h1 标签渲染</u-text>
</template>
```

## 属性

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| type | 文本类型 | [UTextType](#utexttype) | 'primary' |
| size | 文本大小 | [UTextSize](#utextsize) | 'default' |
| ellipsis | 是否显示省略号 | boolean | false |
| maxLine | 最大行数，超出部分会被省略 | number | - |
| tag | 自定义元素标签 | string | 'span' |

## 插槽

| 插槽名 | 说明 |
| --- | --- |
| default | 文本内容 |

## 类型定义

### UTextType

文本类型，用于定义文本的颜色样式。

```ts
type UTextType = 'primary' | 'success' | 'warning' | 'danger' | 'info';
```

### UTextSize

文本大小，用于定义文本的字体大小。

```ts
type UTextSize = 'small' | 'default' | 'large';
``` 