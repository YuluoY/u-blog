# Input 输入框

输入框组件，用于接收用户输入的文本信息。

## 基本用法

```vue
<template>
  <u-input v-model="input" placeholder="请输入内容"></u-input>
</template>

<script setup>
import { ref } from 'vue';

const input = ref('');
</script>
```

## 禁用状态

通过 `disabled` 属性指定是否禁用输入框。

```vue
<template>
  <u-input v-model="input" disabled placeholder="禁用状态"></u-input>
</template>
```

## 可清空

通过 `clearable` 属性可以使输入框可清空。

```vue
<template>
  <u-input v-model="input" clearable placeholder="可清空"></u-input>
</template>
```

## 密码框

通过 `type` 属性指定为密码框，通过 `show-password` 属性可以使密码可见。

```vue
<template>
  <u-input v-model="password" type="password" placeholder="请输入密码"></u-input>
  <u-input v-model="password" type="password" show-password placeholder="可切换显示密码"></u-input>
</template>
```

## 带图标的输入框

通过 `prefix-icon` 和 `suffix-icon` 属性可以在输入框前后添加图标。

```vue
<template>
  <u-input v-model="input" prefix-icon="search" placeholder="搜索内容"></u-input>
  <u-input v-model="input" suffix-icon="calendar" placeholder="选择日期"></u-input>
</template>
```

## 文本域

通过 `type="textarea"` 属性可以使用文本域，通过 `rows` 属性指定行数。

```vue
<template>
  <u-input v-model="textarea" type="textarea" :rows="4" placeholder="请输入多行文本"></u-input>
</template>
```

## 复合型输入框

可以在输入框前后添加自定义内容。

```vue
<template>
  <u-input v-model="input" placeholder="请输入内容">
    <template #prepend>https://</template>
    <template #append>.com</template>
  </u-input>
</template>
```

## 尺寸

通过 `size` 属性指定输入框的尺寸。

```vue
<template>
  <u-input v-model="input" size="large" placeholder="大型输入框"></u-input>
  <u-input v-model="input" placeholder="默认尺寸"></u-input>
  <u-input v-model="input" size="small" placeholder="小型输入框"></u-input>
</template>
```

## 输入长度限制

通过 `maxlength` 和 `minlength` 属性限制输入长度，通过 `show-word-limit` 属性显示字数统计。

```vue
<template>
  <u-input 
    v-model="input" 
    maxlength="20" 
    show-word-limit
    placeholder="最多输入20个字符">
  </u-input>
  
  <u-input 
    v-model="textarea" 
    type="textarea" 
    maxlength="100" 
    show-word-limit
    placeholder="最多输入100个字符">
  </u-input>
</template>
```

## 属性

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| model-value / v-model | 绑定值 | string / number | - |
| type | 输入框类型，可选值为 text、textarea、password、number 等 | [InputType](#input-type) | 'text' |
| size | 输入框尺寸，可选值为 large、default、small | [InputSize](#input-size) | 'default' |
| placeholder | 输入框占位文本 | string | - |
| clearable | 是否可清空 | boolean | false |
| disabled | 是否禁用 | boolean | false |
| readonly | 是否只读 | boolean | false |
| show-password | 是否显示切换密码图标 | boolean | false |
| prefix-icon | 输入框头部图标 | string | - |
| suffix-icon | 输入框尾部图标 | string | - |
| max-length | 最大输入长度 | number / string | - |
| min-length | 最小输入长度 | number / string | - |
| show-word-limit | 是否显示输入字数统计 | boolean | false |
| rows | 文本域行数，只对 type="textarea" 有效 | number | - |
| autocomplete | 原生 autocomplete 属性 | string | 'off' |
| name | 原生 name 属性 | string | - |
| max | 原生 max 属性，只对 type="number" 有效 | string / number | - |
| min | 原生 min 属性，只对 type="number" 有效 | string / number | - |
| step | 原生 step 属性，只对 type="number" 有效 | string / number | - |
| autofocus | 原生 autofocus 属性 | boolean | false |
| form | 原生 form 属性 | string | - |
| tabindex | 输入框的 tabindex | string / number | 0 |
| input-style | 输入框的样式 | CSSProperties / CSSProperties[] / string[] | - |

## 事件

| 事件名 | 说明 | 参数 |
| --- | --- | --- |
| input | 在输入时触发 | (event: Event) |
| change | 在值改变时触发 | (value: string \| number) |
| focus | 在获得焦点时触发 | (event: FocusEvent) |
| blur | 在失去焦点时触发 | (event: FocusEvent) |
| clear | 在点击清空按钮时触发 | (event: MouseEvent) |

## 插槽

| 插槽名 | 说明 |
| --- | --- |
| prefix | 输入框头部内容，只对非 type="textarea" 有效 |
| suffix | 输入框尾部内容，只对非 type="textarea" 有效 |
| prepend | 输入框前置内容，只对非 type="textarea" 有效 |
| append | 输入框后置内容，只对非 type="textarea" 有效 |

## 类型定义

### <span id="input-type">InputType</span>

```ts
type UInputType = 'text' | 'textarea' | 'password' | 'checkbox' | 'file' | 'number' | 'radio';
```

### <span id="input-size">InputSize</span>

```ts
type UInputSize = 'small' | 'default' | 'large';
``` 