# Card 卡片

卡片组件，用于展示内容区域，支持头部、主体和底部三个区域。

## 基本用法

```vue
<template>
  <u-card>
    <div>卡片内容</div>
  </u-card>
</template>
```

## 带标题和底部的卡片

可以通过 `header` 和 `footer` 属性设置卡片的标题和底部内容。

```vue
<template>
  <u-card header="标题" footer="底部内容">
    <div>卡片内容</div>
  </u-card>
</template>
```

## 使用插槽自定义头部和底部

可以通过 `header` 和 `footer` 插槽自定义卡片的头部和底部内容。

```vue
<template>
  <u-card>
    <template #header>
      <div class="custom-header">
        <h3>自定义标题</h3>
        <u-button size="small">操作按钮</u-button>
      </div>
    </template>
    <div>卡片内容</div>
    <template #footer>
      <div class="custom-footer">
        <span>自定义底部</span>
        <u-button type="primary" size="small">确认</u-button>
      </div>
    </template>
  </u-card>
</template>
```

## 卡片阴影

通过 `shadow` 属性设置卡片阴影的显示时机。

```vue
<template>
  <u-card shadow="always">
    <div>总是显示阴影</div>
  </u-card>
  
  <u-card shadow="hover">
    <div>鼠标悬停时显示阴影</div>
  </u-card>
  
  <u-card shadow="never">
    <div>从不显示阴影</div>
  </u-card>
  
  <u-card shadow="active">
    <div>激活时显示阴影</div>
  </u-card>
</template>
```

## 自定义内边距

通过 `padding` 属性设置卡片的内边距。

```vue
<template>
  <u-card :padding="20">
    <div>内边距为 20px 的卡片</div>
  </u-card>
</template>
```

## 自定义主体样式

通过 `body-style` 和 `body-class` 属性自定义卡片主体的样式。

```vue
<template>
  <u-card 
    :body-style="{ color: 'red', backgroundColor: '#f5f5f5' }"
    body-class="custom-body">
    <div>自定义样式的卡片内容</div>
  </u-card>
</template>
```

## 属性

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| header | 卡片标题，如果是 slot 则不生效 | string | - |
| footer | 卡片底部，如果是 slot 则不生效 | string | - |
| shadow | 卡片阴影显示时机，可选值为 'always'、'hover'、'never'、'active' | [CardShadow](#card-shadow) | 'never' |
| padding | 卡片内边距，单位为 px | number | 16 |
| body-style | 卡片主体自定义样式 | CSSProperties | {} |
| body-class | 卡片主体自定义类名 | string | - |

## 插槽

| 插槽名 | 说明 |
| --- | --- |
| default | 卡片主体内容 |
| header | 卡片标题区域 |
| footer | 卡片底部区域 |

## 类型定义

### <span id="card-shadow">CardShadow</span>

```ts
type CardShadow = 'always' | 'hover' | 'never' | 'active';
``` 