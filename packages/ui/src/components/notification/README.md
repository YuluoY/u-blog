# Notification 通知

`notification` 组件用于在页面角落显示通知提醒信息。

## 基本用法

通过调用 `$notification` 方法来显示通知。

```vue
<template>
  <u-button @click="showNotification">显示通知</u-button>
</template>

<script setup>
import { getCurrentInstance } from 'vue'

const { proxy } = getCurrentInstance()

const showNotification = () => {
  proxy.$notification({
    title: '通知标题',
    message: '这是一条通知信息'
  })
}
</script>
```

## 不同类型的通知

通知组件提供了不同类型的通知，包括：成功、警告、信息和错误。

```vue
<template>
  <div>
    <u-button @click="showSuccess">成功</u-button>
    <u-button @click="showWarning">警告</u-button>
    <u-button @click="showInfo">信息</u-button>
    <u-button @click="showError">错误</u-button>
  </div>
</template>

<script setup>
import { getCurrentInstance } from 'vue'

const { proxy } = getCurrentInstance()

const showSuccess = () => {
  proxy.$notification.success({
    title: '成功',
    message: '这是一条成功通知'
  })
}

const showWarning = () => {
  proxy.$notification.warning({
    title: '警告',
    message: '这是一条警告通知'
  })
}

const showInfo = () => {
  proxy.$notification.info({
    title: '信息',
    message: '这是一条信息通知'
  })
}

const showError = () => {
  proxy.$notification.error({
    title: '错误',
    message: '这是一条错误通知'
  })
}
</script>
```

## 自定义位置

通知可以出现在页面的四个角，通过设置 `position` 属性来控制。

```vue
<template>
  <div>
    <u-button @click="topRight">右上角</u-button>
    <u-button @click="topLeft">左上角</u-button>
    <u-button @click="bottomRight">右下角</u-button>
    <u-button @click="bottomLeft">左下角</u-button>
  </div>
</template>

<script setup>
import { getCurrentInstance } from 'vue'

const { proxy } = getCurrentInstance()

const topRight = () => {
  proxy.$notification({
    title: '右上角通知',
    message: '这是一条右上角通知',
    position: 'top-right'
  })
}

const topLeft = () => {
  proxy.$notification({
    title: '左上角通知',
    message: '这是一条左上角通知',
    position: 'top-left'
  })
}

const bottomRight = () => {
  proxy.$notification({
    title: '右下角通知',
    message: '这是一条右下角通知',
    position: 'bottom-right'
  })
}

const bottomLeft = () => {
  proxy.$notification({
    title: '左下角通知',
    message: '这是一条左下角通知',
    position: 'bottom-left'
  })
}
</script>
```

## 自定义持续时间

通过 `duration` 属性设置通知的显示时间，单位为毫秒。设置为 0 则不会自动关闭。

```vue
<template>
  <u-button @click="showNotification">显示通知</u-button>
</template>

<script setup>
import { getCurrentInstance } from 'vue'

const { proxy } = getCurrentInstance()

const showNotification = () => {
  proxy.$notification({
    title: '自定义持续时间',
    message: '这条通知将在 10 秒后关闭',
    duration: 10000
  })
}
</script>
```

## 带有图标的通知

通过设置 `showIcon` 属性来显示图标。

```vue
<template>
  <u-button @click="showNotification">带图标的通知</u-button>
</template>

<script setup>
import { getCurrentInstance } from 'vue'

const { proxy } = getCurrentInstance()

const showNotification = () => {
  proxy.$notification({
    title: '带图标的通知',
    message: '这是一条带有图标的通知',
    showIcon: true
  })
}
</script>
```

## 自定义关闭按钮

通过 `showClose` 属性控制是否显示关闭按钮，通过 `onClose` 回调函数处理关闭事件。

```vue
<template>
  <u-button @click="showNotification">自定义关闭</u-button>
</template>

<script setup>
import { getCurrentInstance } from 'vue'

const { proxy } = getCurrentInstance()

const showNotification = () => {
  proxy.$notification({
    title: '自定义关闭',
    message: '点击关闭按钮触发回调',
    showClose: true,
    onClose: () => {
      console.log('通知已关闭')
    }
  })
}
</script>
```

## API

### 方法

| 方法名 | 说明 | 参数 | 返回值 |
| --- | --- | --- | --- |
| $notification | 显示通知 | NotificationOptions | NotificationInstance |
| $notification.success | 显示成功通知 | NotificationOptions | NotificationInstance |
| $notification.warning | 显示警告通知 | NotificationOptions | NotificationInstance |
| $notification.info | 显示信息通知 | NotificationOptions | NotificationInstance |
| $notification.error | 显示错误通知 | NotificationOptions | NotificationInstance |
| $notification.close | 关闭指定ID的通知 | string (通知ID) | - |
| $notification.closeAll | 关闭所有通知 | - | - |

### NotificationOptions

通知配置选项，类型定义如下：

| 属性 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| title | 通知标题 | string | - |
| message | 通知内容 | string | - |
| type | 通知类型 | 'success' \| 'warning' \| 'info' \| 'error' | 'info' |
| duration | 显示时间，单位为毫秒。设为 0 则不会自动关闭 | number | 4500 |
| position | 通知的位置 | 'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left' | 'top-right' |
| showClose | 是否显示关闭按钮 | boolean | true |
| showIcon | 是否显示图标 | boolean | false |
| offset | 偏移距离，单位为像素 | number | 16 |
| id | 通知的唯一标识 | string | 自动生成 |
| zIndex | CSS z-index 属性 | number | 9999 |
| onClose | 关闭时的回调函数 | Function | - |
| onClick | 点击通知时的回调函数 | Function | - |
| customClass | 自定义 CSS 类名 | string | - |
| dangerouslyUseHTMLString | 是否将 message 属性作为 HTML 片段处理 | boolean | false |

### NotificationInstance

通知实例，类型定义如下：

| 属性/方法 | 说明 | 类型 |
| --- | --- | --- |
| close | 关闭当前通知 | Function |
| id | 通知的唯一标识 | string | 