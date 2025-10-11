# Popconfirm 气泡确认框

点击元素，弹出气泡式的确认框。

## 基础用法

当需要用户进行操作确认时，可以使用 `u-popconfirm` 组件。

```vue
<template>
  <u-popconfirm title="确定删除这条记录吗？">
    <template #reference>
      <u-button>删除</u-button>
    </template>
  </u-popconfirm>
</template>
```

## 自定义按钮文本

可以自定义确认和取消按钮的文本。

```vue
<template>
  <u-popconfirm 
    title="确定提交这个表单吗？" 
    confirm-button-text="是的" 
    cancel-button-text="再想想"
  >
    <template #reference>
      <u-button>提交</u-button>
    </template>
  </u-popconfirm>
</template>
```

## 自定义图标

可以自定义确认框的图标。

```vue
<template>
  <u-popconfirm 
    title="确定执行此操作吗？" 
    icon="warning-circle"
  >
    <template #reference>
      <u-button>执行操作</u-button>
    </template>
  </u-popconfirm>
</template>
```

## 事件处理

可以监听确认和取消事件。

```vue
<template>
  <u-popconfirm 
    title="确定删除这条记录吗？" 
    @confirm="handleConfirm" 
    @cancel="handleCancel"
  >
    <template #reference>
      <u-button>删除</u-button>
    </template>
  </u-popconfirm>
</template>

<script setup>
const handleConfirm = () => {
  console.log('用户确认了操作')
}

const handleCancel = () => {
  console.log('用户取消了操作')
}
</script>
```

## 自定义内容

可以通过默认插槽自定义确认框的内容。

```vue
<template>
  <u-popconfirm>
    <div>这是一个<strong>自定义内容</strong>的确认框</div>
    <template #reference>
      <u-button>自定义内容</u-button>
    </template>
  </u-popconfirm>
</template>
```

## 自定义操作按钮

可以通过 `actions` 插槽自定义操作按钮。

```vue
<template>
  <u-popconfirm title="确定执行此操作吗？">
    <template #actions="{ confirm, cancel }">
      <u-button size="small" @click="cancel">返回</u-button>
      <u-button size="small" type="danger" @click="confirm">确定删除</u-button>
    </template>
    <template #reference>
      <u-button>自定义按钮</u-button>
    </template>
  </u-popconfirm>
</template>
```

## 属性

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| title | 确认框标题 | string | '' |
| confirm-button-text | 确认按钮文本 | string | '确定' |
| cancel-button-text | 取消按钮文本 | string | '取消' |
| confirm-button-type | 确认按钮类型 | string | 'primary' |
| cancel-button-type | 取消按钮类型 | string | - |
| confirm-button-props | 确认按钮属性 | object | - |
| cancel-button-props | 取消按钮属性 | object | - |
| icon | 图标 | string / Component | 'question-circle' |
| icon-color | 图标颜色 | string | - |
| hide-icon | 是否隐藏图标 | boolean | false |
| width | 确认框宽度 | number | 150 |
| tooltip-props | Tooltip 组件属性 | object | - |

有关 `tooltip-props` 的详细属性，请参考 [Tooltip 组件属性](#tooltip-props-详情)。

## 事件

| 事件名 | 说明 | 参数 |
| --- | --- | --- |
| confirm | 点击确认按钮时触发 | MouseEvent |
| cancel | 点击取消按钮时触发 | MouseEvent |

## 插槽

| 插槽名 | 说明 |
| --- | --- |
| default | 自定义确认框内容 |
| reference | 触发确认框显示的元素 |
| actions | 自定义操作按钮，参数为 { confirm, cancel } |

## Tooltip Props 详情 {#tooltip-props-详情}

`tooltip-props` 属性接受 Tooltip 组件的所有属性，主要包括：

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| effect | 主题 | 'dark' / 'light' | 'dark' |
| content | 显示的内容 | string | - |
| placement | 出现位置 | 'top' / 'top-start' / 'top-end' / 'bottom' / 'bottom-start' / 'bottom-end' / 'left' / 'left-start' / 'left-end' / 'right' / 'right-start' / 'right-end' | 'bottom' |
| visible | 是否显示 | boolean | false |
| disabled | 是否禁用 | boolean | false |
| offset | 出现位置的偏移量 | number | 0 |
| transition | 过渡动画 | string | 'fade-in-linear' |
| show-arrow | 是否显示箭头 | boolean | true |
| popper-options | popper.js 参数 | object | - |
| show-after | 延迟出现，单位毫秒 | number | 0 |
| hide-after | 延迟消失，单位毫秒 | number | 0 |
| auto-close | 自动隐藏延时，单位毫秒 | number | 0 |
| manual | 是否手动控制 | boolean | false |
| popper-class | 为 popper 添加类名 | string | - |
| enterable | 鼠标是否可进入到 tooltip 中 | boolean | true |
| teleported | 是否使用 teleport | boolean | true |
``` 