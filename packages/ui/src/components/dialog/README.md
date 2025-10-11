# UDialog 对话框组件

UDialog 是一个功能丰富的对话框组件，用于在用户执行操作时展示内容、警告或请求用户进行输入。支持可拖拽、可调整大小、可折叠等特性。

## 基本用法

```vue
<template>
  <u-button @click="dialogVisible = true">打开对话框</u-button>
  
  <u-dialog v-model="dialogVisible" title="标题">
    <p>这是一个基本的对话框内容</p>
  </u-dialog>
</template>

<script setup>
import { ref } from 'vue'

const dialogVisible = ref(false)
</script>
```

## 自定义内容

```vue
<template>
  <u-dialog v-model="dialogVisible" title="自定义内容">
    <template #default>
      <div class="custom-content">
        <p>这是自定义内容区域</p>
        <u-input v-model="inputValue" placeholder="请输入内容" />
      </div>
    </template>
  </u-dialog>
</template>

<script setup>
import { ref } from 'vue'

const dialogVisible = ref(false)
const inputValue = ref('')
</script>
```

## 自定义底部按钮

```vue
<template>
  <u-dialog v-model="dialogVisible" title="自定义底部按钮">
    <p>对话框内容</p>
    <template #footer>
      <u-button type="primary" @click="handleConfirm">确定</u-button>
      <u-button @click="dialogVisible = false">取消</u-button>
      <u-button type="danger" @click="handleDelete">删除</u-button>
    </template>
  </u-dialog>
</template>

<script setup>
import { ref } from 'vue'

const dialogVisible = ref(false)

function handleConfirm() {
  // 处理确认逻辑
  dialogVisible.value = false
}

function handleDelete() {
  // 处理删除逻辑
  dialogVisible.value = false
}
</script>
```

## 可折叠对话框

```vue
<template>
  <u-dialog 
    v-model="dialogVisible" 
    title="可折叠对话框"
    show-collapse-icon
    @collapse="handleCollapse"
  >
    <p>点击标题栏右侧的折叠图标可以折叠对话框</p>
  </u-dialog>
</template>

<script setup>
import { ref } from 'vue'

const dialogVisible = ref(false)

function handleCollapse(isCollapsed) {
  console.log('对话框折叠状态:', isCollapsed)
}
</script>
```

## 无遮罩层对话框

```vue
<template>
  <u-dialog 
    v-model="dialogVisible" 
    title="无遮罩层对话框"
    :modal="false"
  >
    <p>这个对话框没有遮罩层，可以与页面其他元素交互</p>
  </u-dialog>
</template>

<script setup>
import { ref } from 'vue'

const dialogVisible = ref(false)
</script>
```

## 函数式调用

除了组件形式，UDialog 还支持函数式调用：

### 导入方式调用

```js
import { UDialogFn } from '@ucc-ui/components'

// 基本调用
const dialog = UDialogFn({
  title: '函数式对话框',
  content: '这是通过函数调用的对话框',
  modal: true
})

// 关闭对话框
dialog.close()

// 带确认回调的对话框
UDialogFn({
  title: '确认操作',
  content: '确定要执行此操作吗？',
  confirm: async () => {
    // 返回 true 将自动关闭对话框
    // 返回 false 将保持对话框打开
    try {
      await someAsyncOperation()
      return true
    } catch (error) {
      console.error(error)
      return false
    }
  }
})

// 单例模式（默认）
// 每次调用会关闭之前的对话框
UDialogFn({
  title: '单例对话框',
  content: '这是一个单例对话框',
  single: true // 默认为 true
})

// 多例模式
// 可以同时打开多个对话框
UDialogFn({
  title: '多例对话框',
  content: '这是一个多例对话框',
  single: false
})
```

### 全局方法调用

当组件库全局安装后，可以通过 Vue 实例的 `$dialog` 方法调用：

```js
// 在 Vue 2 组件中
export default {
  methods: {
    showConfirmDialog() {
      const dialog = this.$dialog({
        title: '确认操作',
        content: '确定要删除这条记录吗？',
        modal: true,
        confirm: async () => {
          try {
            await this.deleteRecord()
            this.$message.success('删除成功')
            return true
          } catch (error) {
            this.$message.error('删除失败')
            return false
          }
        }
      })
      
      // 也可以手动关闭
      // dialog.close()
    }
  }
}

// 在 Vue 3 的 setup 中
import { getCurrentInstance } from 'vue'

export default {
  setup() {
    const { proxy } = getCurrentInstance()
    
    function showDialog() {
      proxy.$dialog({
        title: '提示',
        content: '这是一个通过全局方法调用的对话框',
        showFooter: false
      })
    }
    
    return { showDialog }
  }
}
```

## API

### UDialog Props

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| modelValue / v-model | 是否显示对话框 | boolean | false |
| title | 对话框标题 | string | '标题' |
| content | 对话框内容 | VNode / Component / string / Function | '弹窗内容' |
| width | 对话框宽度（小于1时为屏幕宽度的比例，大于1时为像素值） | number | 0.4 |
| height | 对话框高度（小于1时为屏幕高度的比例，大于1时为像素值） | number | 0.4 |
| modal | 是否显示遮罩层 | boolean | false |
| modalClass | 遮罩层自定义类名 | string | - |
| closeIcon | 关闭图标 | string / string[] | 'close' |
| collapseIcon | 折叠图标 | string / string[] | ['fas', 'chevron-down'] |
| appendTo | 对话框挂载的容器元素 | string / HTMLElement | 'body' |
| openDelay | 打开延时 | number | 0 |
| closeDelay | 关闭延时 | number | 0 |
| closeOnClickModal | 是否可以点击遮罩层关闭 | boolean | true |
| closeOnPressEscape | 是否可以使用ESC按键关闭 | boolean | true |
| showCollapseIcon | 是否显示折叠按钮 | boolean | false |
| showCloseIcon | 是否显示关闭按钮 | boolean | true |
| zIndex | 对话框层级 | number | 2000 |
| showFooter | 是否显示底部按钮 | boolean | true |

### UDialog Events

| 事件名 | 说明 | 参数 |
| --- | --- | --- |
| update:modelValue | 显示/隐藏状态改变时触发 | (value: boolean) |
| open | 对话框打开时触发 | - |
| collapse | 对话框折叠状态改变时触发 | (isCollapsed: boolean) |
| confirm | 点击确认按钮时触发 | (close: () => void) |
| cancel | 点击取消按钮或关闭对话框时触发 | - |
| click-modal | 点击遮罩层时触发 | - |

### UDialog Slots

| 插槽名 | 说明 |
| --- | --- |
| default | 对话框内容 |
| footer | 对话框底部按钮区域 |

### UDialog Methods

| 方法名 | 说明 | 参数 |
| --- | --- | --- |
| open | 打开对话框 | - |
| close | 关闭对话框 | - |
| collapse | 折叠/展开对话框 | - |
| resetPosition | 重置对话框位置 | - |

### UDialogFn 函数式调用参数

| 参数名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| ...UDialogProps | 支持所有 UDialog 组件的 props | - | - |
| single | 是否为单例模式（每次调用会关闭之前的对话框） | boolean | true |
| confirm | 确认回调函数，返回 Promise<boolean>，true 表示关闭对话框 | () => Promise<boolean> | - |

### UDialogFn 返回值

| 属性名 | 说明 | 类型 |
| --- | --- | --- |
| close | 关闭对话框的方法 | () => void |

## 特性

1. **可拖拽**：通过标题栏可以拖动对话框到任意位置
2. **可调整大小**：可以通过拖动对话框边缘调整大小
3. **可折叠**：支持折叠/展开对话框
4. **多层级管理**：自动管理多个对话框的层级关系，点击对话框会将其置于最上层
5. **函数式调用**：支持组件形式和函数式两种调用方式
6. **自定义内容和按钮**：支持通过插槽自定义内容和底部按钮

## 注意事项

1. 当设置 `width` 或 `height` 小于等于 1 时，将被视为屏幕宽度/高度的比例
2. 函数式调用默认为单例模式，每次调用会关闭之前的对话框
3. 对话框支持通过 ESC 键关闭，可通过 `closeOnPressEscape` 属性控制
4. 对话框默认挂载到 body 元素，可通过 `appendTo` 属性自定义挂载位置