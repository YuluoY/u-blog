# UDropdown 下拉菜单组件

UDropdown 是一个功能丰富的下拉菜单组件，用于在点击/悬停触发器时显示一组相关操作或导航选项。

## 基本用法

```vue
<template>
  <u-dropdown>
    <u-button>下拉菜单</u-button>
    <template #dropdown>
      <u-dropdown-item label="选项1" />
      <u-dropdown-item label="选项2" />
      <u-dropdown-item label="选项3" disabled />
      <u-dropdown-item divided />
      <u-dropdown-item label="选项4" />
    </template>
  </u-dropdown>
</template>
```

## 使用数据属性

您可以通过 `data` 属性传递菜单项数据，而不是使用插槽：

```vue
<template>
  <u-dropdown :data="dropdownItems">
    <u-button>下拉菜单</u-button>
  </u-dropdown>
</template>

<script setup>
const dropdownItems = [
  { label: '选项1', command: 'option1' },
  { label: '选项2', command: 'option2' },
  { label: '选项3', disabled: true },
  { divided: true },
  { label: '选项4', command: 'option4' }
]
</script>
```

## 触发方式

通过 `trigger` 属性设置触发方式：

```vue
<template>
  <u-dropdown trigger="hover">
    <u-button>悬停触发</u-button>
    <template #dropdown>
      <u-dropdown-item label="选项1" />
      <u-dropdown-item label="选项2" />
    </template>
  </u-dropdown>
</template>
```

## 分离式按钮

使用 `split-button` 属性创建一个分离式的下拉按钮：

```vue
<template>
  <u-dropdown split-button @click="handleClick">
    <span>点击左侧</span>
    <template #dropdown>
      <u-dropdown-item label="选项1" />
      <u-dropdown-item label="选项2" />
    </template>
  </u-dropdown>
</template>

<script setup>
function handleClick(e) {
  console.log('按钮被点击', e)
}
</script>
```

## 带图标的菜单项

```vue
<template>
  <u-dropdown>
    <u-button>带图标的菜单</u-button>
    <template #dropdown>
      <u-dropdown-item label="编辑" icon="edit" />
      <u-dropdown-item label="删除" icon="trash" />
      <u-dropdown-item label="信息" icon="info-circle" />
    </template>
  </u-dropdown>
</template>
```

## 禁用状态

```vue
<template>
  <u-dropdown disabled>
    <u-button>禁用的下拉菜单</u-button>
    <template #dropdown>
      <u-dropdown-item label="选项1" />
      <u-dropdown-item label="选项2" />
    </template>
  </u-dropdown>
</template>
```

## 不同尺寸

```vue
<template>
  <u-dropdown size="small">
    <u-button>小尺寸</u-button>
    <template #dropdown>
      <u-dropdown-item label="选项1" />
      <u-dropdown-item label="选项2" />
    </template>
  </u-dropdown>
</template>
```

## 处理菜单项点击

```vue
<template>
  <u-dropdown @command="handleCommand">
    <u-button>下拉菜单</u-button>
    <template #dropdown>
      <u-dropdown-item label="选项1" command="option1" />
      <u-dropdown-item label="选项2" command="option2" />
    </template>
  </u-dropdown>
</template>

<script setup>
function handleCommand(command) {
  console.log(`点击了菜单项，命令为: ${command}`)
}
</script>
```

## API

### UDropdown Props

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| data | 下拉菜单的数据 | UDropdownItemProps[] | [] |
| type | 下拉菜单的类型 | string | 'default' |
| size | 下拉菜单的尺寸 | 'default' / 'small' / 'large' | 'default' |
| maxHeight | 菜单最大高度 | number | - |
| splitButton | 下拉触发元素呈现为按钮组 | boolean | false |
| disabled | 下拉菜单是否禁用 | boolean | false |
| placement | 下拉菜单的弹出位置 | string | 'bottom' |
| trigger | 触发下拉的行为 | 'hover' / 'click' / 'contextmenu' | 'click' |
| hideOnClick | 点击菜单项后是否隐藏菜单 | boolean | true |
| showTimeout | 菜单显示延时 | number | 150 |
| hideTimeout | 菜单隐藏延时 | number | 150 |
| role | 下拉菜单ARIA属性 | string | 'menu' |
| tabindex | 下拉菜单的tabindex属性 | number | 0 |
| tooltipProps | 下拉菜单的tooltip属性 | UTooltipProps | - |
| teleported | 下拉菜单是否被挂载到body上 | boolean | false |

### UDropdown Events

| 事件名 | 说明 | 参数 |
| --- | --- | --- |
| command | 点击菜单项时触发 | 菜单项的command值 |
| visible-change | 下拉菜单显示状态变化时触发 | 显示状态(boolean) |
| click | 点击分离式按钮时触发 | MouseEvent |

### UDropdown Methods

| 方法名 | 说明 | 参数 |
| --- | --- | --- |
| doShow | 手动显示下拉菜单 | - |
| doHide | 手动隐藏下拉菜单 | - |

### UDropdownItem Props

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| label | 菜单项的文本 | string | - |
| command | 菜单项的命令 | string / number / object | 自动生成的ID |
| disabled | 菜单项是否禁用 | boolean | false |
| divided | 菜单项是否显示分割线 | boolean | false |
| icon | 菜单项的图标 | string / Component | - |
| iconProps | 菜单项的图标属性 | UIconProps | - |

## 注意事项

1. 当使用 `data` 属性时，不需要提供 `#dropdown` 插槽内容
2. 使用 `split-button` 时，点击左侧按钮会触发 `click` 事件，点击右侧下拉图标会显示下拉菜单
3. 默认情况下，点击菜单项后会自动关闭下拉菜单，可以通过 `hide-on-click` 属性控制此行为
4. 可以通过 `doShow` 和 `doHide` 方法手动控制下拉菜单的显示和隐藏 