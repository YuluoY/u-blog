# Collapse 折叠面板

折叠面板组件，用于将内容区域折叠/展开。

## 基本用法

使用 `v-model` 绑定当前激活的面板。

```vue
<template>
  <u-collapse v-model="activeNames">
    <u-collapse-item name="1" title="面板1">
      这是面板1的内容
    </u-collapse-item>
    <u-collapse-item name="2" title="面板2">
      这是面板2的内容
    </u-collapse-item>
    <u-collapse-item name="3" title="面板3">
      这是面板3的内容
    </u-collapse-item>
  </u-collapse>
</template>

<script setup>
import { ref } from 'vue';

const activeNames = ref(['1']);
</script>
```

## 手风琴模式

通过 `accordion` 属性设置为手风琴模式，每次只能展开一个面板。

```vue
<template>
  <u-collapse v-model="activeName" accordion>
    <u-collapse-item name="1" title="面板1">
      这是面板1的内容
    </u-collapse-item>
    <u-collapse-item name="2" title="面板2">
      这是面板2的内容
    </u-collapse-item>
    <u-collapse-item name="3" title="面板3">
      这是面板3的内容
    </u-collapse-item>
  </u-collapse>
</template>

<script setup>
import { ref } from 'vue';

const activeName = ref(['1']);
</script>
```

## 自定义标题

通过 `title` 插槽自定义面板标题内容。

```vue
<template>
  <u-collapse v-model="activeNames">
    <u-collapse-item name="1">
      <template #title>
        <div class="custom-title">
          <u-icon icon="info-circle" />
          <span>自定义标题1</span>
        </div>
      </template>
      这是面板1的内容
    </u-collapse-item>
    <u-collapse-item name="2">
      <template #title>
        <div class="custom-title">
          <u-icon icon="question-circle" />
          <span>自定义标题2</span>
        </div>
      </template>
      这是面板2的内容
    </u-collapse-item>
  </u-collapse>
</template>

<script setup>
import { ref } from 'vue';

const activeNames = ref(['1']);
</script>
```

## 自定义图标

通过 `icon` 插槽或 `icon-props` 属性自定义面板右侧的图标。

```vue
<template>
  <u-collapse v-model="activeNames">
    <u-collapse-item name="1" title="使用icon-props">
      <template #icon>
        <u-icon icon="plus" />
      </template>
      这是面板1的内容
    </u-collapse-item>
    <u-collapse-item 
      name="2" 
      title="使用iconProps属性" 
      :icon-props="{ icon: 'arrow-down', color: 'red' }">
      这是面板2的内容
    </u-collapse-item>
  </u-collapse>
</template>

<script setup>
import { ref } from 'vue';

const activeNames = ref(['1']);
</script>
```

## 禁用状态

通过 `disabled` 属性禁用某个面板。

```vue
<template>
  <u-collapse v-model="activeNames">
    <u-collapse-item name="1" title="面板1">
      这是面板1的内容
    </u-collapse-item>
    <u-collapse-item name="2" title="面板2" disabled>
      这是面板2的内容
    </u-collapse-item>
    <u-collapse-item name="3" title="面板3">
      这是面板3的内容
    </u-collapse-item>
  </u-collapse>
</template>

<script setup>
import { ref } from 'vue';

const activeNames = ref(['1']);
</script>
```

## Collapse 属性

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| model-value / v-model | 当前激活的面板名称 | string[] | [] |
| accordion | 是否手风琴模式 | boolean | false |

## Collapse 事件

| 事件名 | 说明 | 参数 |
| --- | --- | --- |
| change | 当前激活面板改变时触发 | (activeNames: string[]) |

## CollapseItem 属性

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| name | 唯一标识符，必填 | string | - |
| title | 面板标题 | string | - |
| disabled | 是否禁用 | boolean | false |
| icon-props | 自定义图标属性 | [IconProps](#icon-props) | - |

## CollapseItem 插槽

| 插槽名 | 说明 |
| --- | --- |
| default | 面板内容 |
| title | 面板标题 |
| icon | 面板右侧图标 |

## 类型定义

### <span id="icon-props">IconProps</span>

```ts
interface UIconProps {
  icon: string;         // 图标名称
  size?: string | number; // 图标大小
  color?: string;       // 图标颜色
  spin?: boolean;       // 是否旋转
  // 其他图标属性...
}
``` 