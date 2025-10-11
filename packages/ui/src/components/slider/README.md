# Slider 滑块组件

滑块组件允许用户在固定区间内选择一个值或一个范围。

## 基本用法

```vue
<template>
  <u-slider v-model="value" />
</template>

<script setup>
import { ref } from 'vue';

const value = ref(50);
</script>
```

## 设置最大值和最小值

```vue
<template>
  <u-slider v-model="value" :min="10" :max="90" />
</template>

<script setup>
import { ref } from 'vue';

const value = ref(50);
</script>
```

## 设置步长

```vue
<template>
  <u-slider v-model="value" :step="10" />
</template>

<script setup>
import { ref } from 'vue';

const value = ref(50);
</script>
```

## 显示输入框

```vue
<template>
  <u-slider v-model="value" :show-input="true" />
</template>

<script setup>
import { ref } from 'vue';

const value = ref(50);
</script>
```

## 范围选择

```vue
<template>
  <u-slider v-model="value" :range="true" />
</template>

<script setup>
import { ref } from 'vue';

const value = ref([20, 80]);
</script>
```

## 垂直模式

```vue
<template>
  <div style="height: 200px;">
    <u-slider v-model="value" :vertical="true" height="200px" />
  </div>
</template>

<script setup>
import { ref } from 'vue';

const value = ref(50);
</script>
```

## 显示间断点

```vue
<template>
  <u-slider v-model="value" :show-stops="true" :step="10" />
</template>

<script setup>
import { ref } from 'vue';

const value = ref(50);
</script>
```

## 格式化提示信息

```vue
<template>
  <u-slider v-model="value" :format-tooltip="formatTooltip" />
</template>

<script setup>
import { ref } from 'vue';

const value = ref(50);
const formatTooltip = (val) => {
  return val + ' %';
};
</script>
```

## 属性

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| model-value / v-model | 滑块的值 | number / number[] | 0 |
| min | 最小值 | number | 0 |
| max | 最大值 | number | 100 |
| step | 步长 | number | 1 |
| disabled | 是否禁用 | boolean | false |
| show-input | 是否显示输入框 | boolean | false |
| show-input-control | 在显示输入框的情况下，是否显示输入框的控制按钮 | boolean | false |
| size | 滑块的尺寸，可选值为 'large'、'default'、'small' | string | 'default' |
| input-size | 输入框的尺寸，如果设置了 size 属性，默认值自动取 size | string | 'default' |
| show-stops | 是否显示间断点 | boolean | false |
| show-tooltip | 是否显示提示 | boolean | true |
| format-tooltip | 格式化提示信息 | Function(value) | — |
| range | 是否为范围选择 | boolean | false |
| vertical | 是否竖向模式 | boolean | false |
| height | 滑块高度，竖向模式必填 | string | — |
| tooltip-class | tooltip 的自定义类名 | string | — |
| placement | Tooltip 出现的位置 | string | 'top' |
| marks | 标记，key 的类型必须为 number 且取值在闭区间 [min, max] 内 | object | {} |
| validate-event | 输入时是否触发表单的校验 | boolean | false |

## 事件

| 事件名 | 说明 | 参数 |
| --- | --- | --- |
| change | 值改变时触发（使用鼠标拖曳时，只在松开鼠标后触发） | 改变后的值 |
| input | 值改变时触发（实时触发） | 改变后的值 |


## 详细属性说明

### marks 属性

marks 属性用于在滑块上显示标记点，可以自定义标记点的样式和标签。

```vue
<template>
  <u-slider v-model="value" :marks="marks" />
</template>

<script setup>
import { ref } from 'vue';

const value = ref(50);
const marks = {
  0: '0°C',
  25: '25°C',
  50: '50°C',
  75: '75°C',
  100: {
    style: {
      color: '#f50',
    },
    label: '100°C',
  },
};
</script>
```

### popperOptions 属性

popperOptions 属性用于配置 Tooltip 的 popper.js 参数，详细配置请参考 [popper.js 文档](https://popper.js.org/docs/v2/)。

```vue
<template>
  <u-slider 
    v-model="value" 
    :popper-options="{
      modifiers: [
        {
          name: 'offset',
          options: {
            offset: [0, 8],
          },
        },
      ],
    }" 
  />
</template>

<script setup>
import { ref } from 'vue';

const value = ref(50);
</script>
``` 