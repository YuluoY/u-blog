# Message 消息提示

消息提示组件，用于页面中展示重要的提示信息。

## 基本用法

从顶部出现，3秒后自动消失。

```vue
<template>
  <u-button @click="open">显示消息</u-button>
</template>

<script setup>
import { UMessage } from 'ucc-ui';

const open = () => {
  UMessage('这是一条消息提示');
};
</script>
```

## 不同类型

提供了 success、warning、error 和 info 四种不同类型的消息提示。

```vue
<template>
  <u-button @click="open1">成功</u-button>
  <u-button @click="open2">警告</u-button>
  <u-button @click="open3">错误</u-button>
  <u-button @click="open4">信息</u-button>
</template>

<script setup>
import { UMessage } from 'ucc-ui';

const open1 = () => {
  UMessage.success('这是一条成功消息');
};
const open2 = () => {
  UMessage.warning('这是一条警告消息');
};
const open3 = () => {
  UMessage.error('这是一条错误消息');
};
const open4 = () => {
  UMessage.info('这是一条信息消息');
};
</script>
```

## 可关闭的消息提示

可以添加关闭按钮。

```vue
<template>
  <u-button @click="open">显示可关闭消息</u-button>
</template>

<script setup>
import { UMessage } from 'ucc-ui';

const open = () => {
  UMessage({
    message: '这是一条可关闭的消息提示',
    showClose: true
  });
};
</script>
```

## 文字居中

使用 `center` 属性让文字水平居中。

```vue
<template>
  <u-button @click="open">文字居中</u-button>
</template>

<script setup>
import { UMessage } from 'ucc-ui';

const open = () => {
  UMessage({
    message: '居中的文字',
    center: true
  });
};
</script>
```

## 使用 HTML 片段

通过设置 `dangerouslyUseHTMLString` 属性可以渲染 HTML 片段。

```vue
<template>
  <u-button @click="open">使用 HTML 片段</u-button>
</template>

<script setup>
import { UMessage } from 'ucc-ui';

const open = () => {
  UMessage({
    dangerouslyUseHTMLString: true,
    message: '<strong>这是 <i>HTML</i> 片段</strong>'
  });
};
</script>
```

## 全局方法

可以通过全局方法调用组件。

```js
import { UMessage } from 'ucc-ui';

// 显示普通消息
UMessage('这是一条消息');

// 显示成功消息
UMessage.success('这是一条成功消息');

// 显示警告消息
UMessage.warning('这是一条警告消息');

// 显示错误消息
UMessage.error('这是一条错误消息');

// 显示主要消息
UMessage.primary('这是一条主要消息');

// 关闭所有消息
UMessage.closeAll();

// 关闭所有成功消息
UMessage.closeAll('success');
```

## 通过全局实例使用

Message 组件已经挂载在全局实例上，可以通过 `this.$message` 或 `getCurrentInstance().proxy.$message` 调用。

```vue
<template>
  <u-button @click="showMessage">显示消息</u-button>
</template>

<script setup>
import { getCurrentInstance } from 'vue';

const { proxy } = getCurrentInstance();

const showMessage = () => {
  // 在 setup 中使用
  proxy.$message('这是一条消息');
  
  // 使用不同类型
  proxy.$message.success('成功消息');
  proxy.$message.warning('警告消息');
  proxy.$message.error('错误消息');
  
  // 使用选项
  proxy.$message({
    message: '自定义消息',
    type: 'info',
    duration: 5000
  });
  
  // 关闭所有消息
  proxy.$message.closeAll();
};
</script>
```

在选项式 API 中：

```vue
<template>
  <u-button @click="showMessage">显示消息</u-button>
</template>

<script>
export default {
  methods: {
    showMessage() {
      // 直接使用 this.$message
      this.$message('这是一条消息');
      this.$message.success('成功消息');
    }
  }
}
</script>
```

## 属性

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| message | 消息内容 | string / VNode / Function | — |
| type | 消息类型 | [MessageType](#message-type) | 'info' |
| plain | 是否纯色 | boolean | false |
| icon | 自定义图标，该属性会覆盖 type 的图标 | string / Component | — |
| dangerously-use-html-string | 是否使用 HTML 片段 | boolean | false |
| custom-class | 自定义类名 | string | — |
| duration | 显示时间，单位为毫秒，设置为0则不会自动关闭 | number | 3000 |
| show-close | 是否显示关闭按钮 | boolean | false |
| center | 文字是否居中 | boolean | false |
| z-index | 自定义 z-index | number | 1100 |
| offset | 垂直偏移量 | number | 16 |
| append-to | 指定挂载的 DOM 节点，默认挂载到 body 上 | HTMLElement / string | 'body' |
| grouping | 合并内容相同的消息，不支持VNode类型的消息 | boolean | false |
| repeat-num | 消息重复出现次数，类似于Badge。和grouping配合使用 | number | 1 |
| transition-name | 过渡动画 | string | 'fade-up' |

## 方法

| 方法名 | 说明 | 参数 |
| --- | --- | --- |
| close | 关闭当前消息 | — |
| closeAll | 关闭所有消息 | type (可选) |

## 类型定义

### <span id="message-type">MessageType</span>

```ts
type UMessageType = 'info' | 'success' | 'warning' | 'error' | 'primary';
``` 