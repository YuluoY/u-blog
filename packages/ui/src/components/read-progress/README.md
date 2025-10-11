# ReadProgress 阅读进度条

阅读进度条组件，用于显示页面阅读进度。

## 基础用法

阅读进度条会自动监听页面滚动，并显示当前阅读进度。

```vue
<template>
  <u-read-progress />
</template>
```

## 自定义颜色

可以通过 `type` 或 `color` 属性自定义进度条颜色。

```vue
<template>
  <!-- 使用预设颜色类型 -->
  <u-read-progress type="success" />
  
  <!-- 使用自定义颜色 -->
  <u-read-progress color="#ff6700" />
</template>
```

## 显示进度文本

可以通过 `show-text` 属性显示进度文本。

```vue
<template>
  <u-read-progress show-text />
</template>
```

## 自定义进度文本

可以通过 `content` 属性自定义进度文本内容。

```vue
<template>
  <u-read-progress 
    show-text 
    content="阅读进度" 
  />
</template>
```

## 自定义文本样式

可以通过 `text-type` 和 `text-size` 属性自定义文本样式。

```vue
<template>
  <u-read-progress 
    show-text 
    text-type="danger"
    text-size="large"
  />
</template>
```

## 自定义高度

可以通过 `height` 属性自定义进度条高度。

```vue
<template>
  <u-read-progress :height="8" />
</template>
```

## 手动控制

可以通过 `v-model` 手动控制进度条的值。

```vue
<template>
  <u-read-progress v-model="progress" />
  <u-slider v-model="progress" :min="0" :max="100" />
</template>

<script setup>
import { ref } from 'vue'

const progress = ref(30)
</script>
```

## 方法调用

可以通过方法调用的方式创建进度条。

```js
import { UReadProgressFn } from 'ucc-ui'

// 创建进度条
const progressRef = UReadProgressFn({
  type: 'primary',
  showText: true
})

// 隐藏进度条
progressRef.value?.hide()

// 显示进度条
progressRef.value?.show()
```

## 全局方法

组件库已经将 `$progress` 方法挂载到 Vue 实例上，可以通过 `this.$progress` 或 `getCurrentInstance().proxy.$progress` 直接调用。

```js
<script setup>
import { getCurrentInstance } from 'vue'

// 在 setup 中使用
const { proxy } = getCurrentInstance()

// 创建进度条
const progressRef = proxy.$progress({
  type: 'success',
  showText: true,
  content: '加载中...'
})

// 隐藏进度条
progressRef.value?.hide()

// 显示进度条
progressRef.value?.show()
</script>
```

```js
// 在选项式 API 中使用
export default {
  methods: {
    showProgress() {
      const progressRef = this.$progress({
        type: 'primary',
        showText: true
      })
      
      // 5秒后隐藏
      setTimeout(() => {
        progressRef.value?.hide()
      }, 5000)
    }
  }
}
```

## 属性

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| model-value / v-model | 进度值 | number | 0 |
| type | 进度条颜色类型 | 'primary' / 'danger' / 'warning' / 'success' / 'info' | 'primary' |
| color | 进度条颜色 | string | - |
| background-color | 进度条背景颜色 | string | 'transparent' |
| height | 进度条高度（px） | number | 4 |
| show | 是否显示进度条 | boolean | true |
| show-text | 是否显示文字 | boolean | false |
| text-type | 文字颜色类型 | 'primary' / 'danger' / 'warning' / 'success' / 'info' | 与 type 相同 |
| text-size | 文字大小 | 'default' / 'small' / 'large' | 'default' |
| content | 文字内容 | string | 百分比值 |

有关 `text-type` 和 `text-size` 的详细属性，请参考 [Text 组件属性](#text-props-详情)。

## 事件

| 事件名 | 说明 | 参数 |
| --- | --- | --- |
| update:model-value | 进度值更新时触发 | (value: number) |
| change | 进度改变时触发 | - |

## 插槽

| 插槽名 | 说明 |
| --- | --- |
| default | 自定义文本内容 |

## 暴露的方法

| 方法名 | 说明 | 参数 |
| --- | --- | --- |
| hide | 隐藏进度条 | - |
| show | 显示进度条 | - |

## Text Props 详情 {#text-props-详情}

`text-type` 和 `text-size` 属性接受 Text 组件的相关属性：

### text-type

| 值 | 说明 |
| --- | --- |
| primary | 主要文本颜色 |
| success | 成功文本颜色 |
| warning | 警告文本颜色 |
| danger | 危险文本颜色 |
| info | 信息文本颜色 |

### text-size

| 值 | 说明 |
| --- | --- |
| default | 默认大小 |
| small | 小号文本 |
| large | 大号文本 |
```