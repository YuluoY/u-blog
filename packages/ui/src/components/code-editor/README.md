# CodeEditor 代码编辑器

基于 Monaco Editor 的代码编辑器组件，支持语法高亮、代码补全、格式化等功能。

## 基本用法

```vue
<template>
  <u-code-editor
    v-model:value="code"
    language="javascript"
    theme="vs-dark"
    :height="400"
  />
</template>

<script setup>
import { ref } from 'vue'

const code = ref(`function hello() {
  console.log('Hello, world!');
}`)
</script>
```

## 不同语言支持

```vue
<template>
  <div>
    <!-- JavaScript -->
    <u-code-editor
      v-model:value="jsCode"
      language="javascript"
      theme="vs-dark"
      :height="200"
    />
    
    <!-- TypeScript -->
    <u-code-editor
      v-model:value="tsCode"
      language="typescript"
      theme="vs-dark"
      :height="200"
    />
    
    <!-- JSON -->
    <u-code-editor
      v-model:value="jsonCode"
      language="json"
      theme="vs-dark"
      :height="200"
    />
    
    <!-- CSS -->
    <u-code-editor
      v-model:value="cssCode"
      language="css"
      theme="vs-dark"
      :height="200"
    />
    
    <!-- HTML -->
    <u-code-editor
      v-model:value="htmlCode"
      language="html"
      theme="vs-dark"
      :height="200"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'

const jsCode = ref(`function greet(name) {
  return \`Hello, \${name}!\`;
}`)

const tsCode = ref(`interface User {
  name: string;
  age: number;
}

const user: User = {
  name: 'John',
  age: 30
};`)

const jsonCode = ref(`{
  "name": "John",
  "age": 30,
  "city": "New York"
}`)

const cssCode = ref(`.container {
  display: flex;
  justify-content: center;
  align-items: center;
}`)

const htmlCode = ref(`<!DOCTYPE html>
<html>
<head>
  <title>Hello World</title>
</head>
<body>
  <h1>Hello, World!</h1>
</body>
</html>`)
</script>
```

## 主题设置

```vue
<template>
  <div>
    <!-- 深色主题 -->
    <u-code-editor
      v-model:value="code"
      language="javascript"
      theme="vs-dark"
      :height="200"
    />
    
    <!-- 浅色主题 -->
    <u-code-editor
      v-model:value="code"
      language="javascript"
      theme="vs"
      :height="200"
    />
    
    <!-- 高对比度主题 -->
    <u-code-editor
      v-model:value="code"
      language="javascript"
      theme="hc-black"
      :height="200"
    />
  </div>
</template>
```

## 只读模式

```vue
<template>
  <u-code-editor
    v-model:value="code"
    language="javascript"
    theme="vs-dark"
    :read-only="true"
    :height="300"
  />
</template>
```

## 自定义配置

```vue
<template>
  <u-code-editor
    v-model:value="code"
    language="javascript"
    theme="vs-dark"
    :font-size="16"
    :tab-size="4"
    :minimap="{ enabled: true }"
    :word-wrap="'on'"
    :line-numbers="'on'"
    :height="400"
  />
</template>
```

## 工具箱控制

```vue
<template>
  <div>
    <!-- 显示工具箱 -->
    <u-code-editor
      v-model:value="code"
      language="javascript"
      theme="vs-dark"
      :show-toolbox="true"
      :height="300"
    />
    
    <!-- 隐藏工具箱 -->
    <u-code-editor
      v-model:value="code"
      language="javascript"
      theme="vs-dark"
      :show-toolbox="false"
      :height="300"
    />
    
    <!-- 自定义工具箱 -->
    <u-code-editor
      v-model:value="code"
      language="javascript"
      theme="vs-dark"
      :height="300"
    >
      <template #toolbox>
        <div class="custom-toolbox">
          <button @click="formatCode">格式化</button>
          <button @click="copyCode">复制</button>
        </div>
      </template>
    </u-code-editor>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const code = ref(`function example() {
  const data = { name: 'test', value: 123 };
  return data;
}`)

const formatCode = () => {
  // 格式化代码逻辑
  console.log('格式化代码')
}

const copyCode = () => {
  navigator.clipboard.writeText(code.value)
  console.log('代码已复制')
}
</script>
```

## 阴影效果

```vue
<template>
  <div>
    <!-- 默认阴影 -->
    <u-code-editor
      v-model:value="code"
      language="javascript"
      theme="vs-dark"
      shadow="default"
      :height="200"
    />
    
    <!-- 悬停阴影 -->
    <u-code-editor
      v-model:value="code"
      language="javascript"
      theme="vs-dark"
      shadow="hover"
      :height="200"
    />
  </div>
</template>
```

## 事件监听

```vue
<template>
  <u-code-editor
    v-model:value="code"
    language="javascript"
    theme="vs-dark"
    :height="400"
    @change="handleChange"
  />
</template>

<script setup>
import { ref } from 'vue'

const code = ref(`function example() {
  console.log('Hello');
}`)

const handleChange = (event) => {
  console.log('代码内容发生变化:', event)
  console.log('当前代码:', code.value)
}
</script>
```

## 属性

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| value | 编辑器内容 | string | `function hello() {\n\tconsole.log('Hello, world!');\n}` |
| language | 编程语言 | string | 'javascript' |
| theme | 编辑器主题 | string | 'vs-dark' |
| fontSize | 字体大小 | number | 16 |
| minimap | 缩略图配置 | object | `{ enabled: true }` |
| readOnly | 是否只读 | boolean | false |
| tabSize | 制表符大小 | number | 2 |
| automaticLayout | 是否自动布局 | boolean | false |
| shadow | 阴影效果 | 'default' \| 'hover' | 'hover' |
| showToolbox | 是否显示工具箱 | boolean | true |
| height | 编辑器高度 | number | 400 |
| wordWrap | 自动换行 | 'off' \| 'on' \| 'wordWrapColumn' \| 'bounded' | 'off' |
| lineNumbers | 行号显示 | 'on' \| 'off' \| 'relative' \| 'interval' | 'on' |
| showToolboxLabel | 是否显示工具箱标签 | boolean | false |

## 事件

| 事件名 | 说明 | 参数 |
| --- | --- | --- |
| update:value | 编辑器内容变化时触发 | (value: string) |
| change | 编辑器内容变化时触发 | (event: IModelContentChangedEvent) |

## 插槽

| 插槽名 | 说明 |
| --- | --- |
| default | 编辑器内容 |
| toolbox | 自定义工具箱 |

## 工具箱功能

默认工具箱包含以下功能：

- **增加字号**: 增大编辑器字体
- **减小字号**: 减小编辑器字体  
- **重置字号**: 重置字体为默认大小
- **格式化**: 格式化当前代码
- **缩略图**: 切换缩略图显示/隐藏

## 支持的语言

- JavaScript
- TypeScript
- JSON
- CSS
- SCSS
- Less
- HTML
- Handlebars
- Razor

## 注意事项

1. 组件基于 Monaco Editor，需要确保项目中已正确安装相关依赖
2. 编辑器会自动处理容器大小变化，无需手动调用布局方法
3. 工具箱在 `shadow="hover"` 模式下默认隐藏，鼠标悬停时显示
4. 组件会自动处理 Web Worker 的加载，支持多语言语法高亮和代码补全
