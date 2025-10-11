# Form 表单组件

表单组件用于收集、验证和提交数据，由 `u-form` 和 `u-form-item` 组成。

## 基础用法

基础的表单包含各种输入表单项，比如 input、select、radio、checkbox 等。在每一个 form-item 中，你需要通过 `prop` 属性设置对应表单域 model 中的字段名。

```vue
<template>
  <u-form :model="form" :rules="rules" ref="formRef">
    <u-form-item label="用户名" prop="username">
      <u-input v-model="form.username" />
    </u-form-item>
    <u-form-item label="密码" prop="password">
      <u-input v-model="form.password" type="password" />
    </u-form-item>
    <u-form-item>
      <u-button type="primary" @click="submitForm">提交</u-button>
      <u-button @click="resetForm">重置</u-button>
    </u-form-item>
  </u-form>
</template>

<script setup>
import { ref, reactive } from 'vue'

const formRef = ref(null)

const form = reactive({
  username: '',
  password: ''
})

const rules = reactive({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 30, message: '长度在 6 到 30 个字符', trigger: 'blur' }
  ]
})

const submitForm = async () => {
  try {
    await formRef.value.validate()
    // 表单验证通过，可以提交数据
    console.log('表单验证通过', form)
  } catch (error) {
    console.error('表单验证失败', error)
  }
}

const resetForm = () => {
  formRef.value.resetFields()
}
</script>
```

## 行内表单

设置 `inline` 属性可以让表单域变为行内的表单域。

```vue
<template>
  <u-form :model="form" inline>
    <u-form-item label="用户名" prop="username">
      <u-input v-model="form.username" placeholder="请输入用户名" />
    </u-form-item>
    <u-form-item label="密码" prop="password">
      <u-input v-model="form.password" type="password" placeholder="请输入密码" />
    </u-form-item>
    <u-form-item>
      <u-button type="primary">查询</u-button>
    </u-form-item>
  </u-form>
</template>
```

## 表单验证

Form 组件提供了表单验证的功能，只需要通过 `rules` 属性传入约定的验证规则，并将 form-item 的 `prop` 属性设置为需校验的字段名即可。

```vue
<template>
  <u-form :model="form" :rules="rules" ref="formRef">
    <u-form-item label="邮箱" prop="email">
      <u-input v-model="form.email" />
    </u-form-item>
    <u-form-item label="年龄" prop="age">
      <u-input v-model.number="form.age" />
    </u-form-item>
    <u-form-item>
      <u-button type="primary" @click="submitForm">提交</u-button>
    </u-form-item>
  </u-form>
</template>

<script setup>
import { ref, reactive } from 'vue'

const formRef = ref(null)

const form = reactive({
  email: '',
  age: ''
})

const rules = reactive({
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  age: [
    { required: true, message: '请输入年龄', trigger: 'blur' },
    { type: 'number', message: '年龄必须为数字', trigger: 'blur' },
    { min: 18, max: 120, message: '年龄必须在 18 到 120 之间', trigger: 'blur' }
  ]
})

const submitForm = async () => {
  try {
    await formRef.value.validate()
    console.log('表单验证通过')
  } catch (error) {
    console.error('表单验证失败')
  }
}
</script>
```

## 自定义校验规则

除了使用内置的校验规则外，还可以通过传入 `validator` 函数来自定义校验规则。

```vue
<template>
  <u-form :model="form" :rules="rules" ref="formRef">
    <u-form-item label="密码" prop="password">
      <u-input v-model="form.password" type="password" />
    </u-form-item>
    <u-form-item label="确认密码" prop="confirmPassword">
      <u-input v-model="form.confirmPassword" type="password" />
    </u-form-item>
    <u-form-item>
      <u-button type="primary" @click="submitForm">提交</u-button>
    </u-form-item>
  </u-form>
</template>

<script setup>
import { ref, reactive } from 'vue'

const formRef = ref(null)

const form = reactive({
  password: '',
  confirmPassword: ''
})

const validatePass = (rule, value) => {
  if (value === '') {
    return Promise.reject('请输入密码')
  }
  return Promise.resolve()
}

const validatePass2 = (rule, value) => {
  if (value === '') {
    return Promise.reject('请再次输入密码')
  } else if (value !== form.password) {
    return Promise.reject('两次输入密码不一致')
  }
  return Promise.resolve()
}

const rules = reactive({
  password: [
    { validator: validatePass, trigger: 'blur' }
  ],
  confirmPassword: [
    { validator: validatePass2, trigger: 'blur' }
  ]
})

const submitForm = async () => {
  try {
    await formRef.value.validate()
    console.log('表单验证通过')
  } catch (error) {
    console.error('表单验证失败')
  }
}
</script>
```

## API

### Form 属性

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| model | 表单数据对象 | `Record<string, any>` | — |
| rules | 表单验证规则 | `FormRules` | — |
| inline | 是否为行内表单 | `boolean` | `false` |
| label-position | 表单域标签的位置，可选值为 `left`、`right`、`top` | `string` | `right` |
| label-width | 表单域标签的宽度，例如 `'50px'`。作为 Form 直接子元素的 form-item 会继承该值。支持 `auto` | `string` / `number` | — |
| label-suffix | 表单域标签的后缀 | `string` | — |
| hide-required-asterisk | 是否隐藏必填字段标签旁边的红色星号 | `boolean` | `false` |
| required-asterisk-position | 星号的位置，可选值为 `left`、`right` | `string` | `left` |
| show-message | 是否显示校验错误信息 | `boolean` | `true` |
| inline-message | 是否以行内形式展示校验信息 | `boolean` | `false` |
| status-icon | 是否在输入框中显示校验结果反馈图标 | `boolean` | `false` |
| validate-on-rule-change | 是否在 `rules` 属性改变后立即触发一次验证 | `boolean` | `true` |
| size | 用于控制该表单内组件的尺寸，可选值为 `large`、`default`、`small` | `string` | — |

### Form 方法

| 方法名 | 说明 | 参数 |
| --- | --- | --- |
| validate | 对整个表单进行校验的方法，返回 Promise | `(callback?: (isValid: boolean, invalidFields?: ValidateFieldsError) => void) => Promise<void>` |
| validateField | 对部分表单字段进行校验的方法，返回 Promise | `(props?: string \| string[], callback?: (isValid: boolean) => void) => Promise<boolean>` |
| resetFields | 对整个表单进行重置，将所有字段值重置为初始值并移除校验结果 | — |
| clearValidate | 移除表单项的校验结果 | `(props?: string \| string[]) => void` |
| scrollToField | 滚动到指定表单字段 | `(prop: string \| string[]) => void` |

### FormItem 属性

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| prop | model 的键名。它可以是一个属性的值（如: `a.b.0` 或 `['a', 'b', '0']`）。在使用了 validate、resetFields 的方法时，该属性是必填的 | `string` / `string[]` | — |
| label | 标签文本 | `string` | — |
| label-width | 标签宽度，例如 `'50px'`。支持 `auto` | `string` / `number` | — |

### FormItem 方法

| 方法名 | 说明 | 参数 |
| --- | --- | --- |
| validate | 对该表单项进行校验 | `(trigger: string, callback?: (isValid: boolean) => void) => Promise<boolean>` |
| resetField | 对该表单项进行重置，将其值重置为初始值并移除校验结果 | — |
| clearValidate | 移除该表单项的校验结果 | — |

### FormRuleItem 属性

表单验证规则是一个对象数组，具体配置见下表。完整的[验证规则](#验证规则)请参考文档底部。

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| type | 验证字段的类型 | `string` | — |
| required | 是否必填 | `boolean` | `false` |
| message | 错误消息 | `string` | — |
| trigger | 触发验证的时机，可选值为 `blur`、`change`、`focus` | `string` / `string[]` | — |
| min | 最小长度或最小值 | `number` | — |
| max | 最大长度或最大值 | `number` | — |
| length | 确切的长度 | `number` | — |
| enum | 枚举值 | `any[]` | — |
| pattern | 正则表达式 | `RegExp` | — |
| validator | 自定义验证函数 | `(rule: FormRuleItem, value: any) => Promise<void> \| void` | — |
| transform | 在验证前转换值的函数 | `(value: any) => any` | — |

## 验证规则

Form 组件使用 async-validator 进行表单验证。以下是完整的验证规则列表：

### 类型验证

通过 `type` 属性指定字段的类型，支持以下类型：

- `string`: 字符串类型
- `number`: 数字类型
- `boolean`: 布尔类型
- `array`: 数组类型
- `object`: 对象类型
- `date`: 日期类型
- `url`: URL 类型
- `email`: 邮箱类型

### 必填验证

通过 `required` 属性指定字段是否必填。

### 长度验证

- `min`: 最小长度（字符串、数组）或最小值（数字）
- `max`: 最大长度（字符串、数组）或最大值（数字）
- `length`: 确切的长度（字符串、数组）

### 枚举验证

通过 `enum` 属性指定字段的可选值。

### 正则验证

通过 `pattern` 属性指定字段的正则表达式。

### 自定义验证

通过 `validator` 属性指定自定义验证函数。 