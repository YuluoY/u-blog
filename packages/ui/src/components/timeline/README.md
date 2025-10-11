# Timeline 时间线

时间线组件用于展示一系列事件或步骤的进度。

## 基础用法

```vue
<template>
  <UTimeline :data="timelineData" />
</template>

<script setup>
import { UTimeline } from 'ucc-ui'

const timelineData = [
  {
    content: '创建项目',
    date: '2024-01-01',
    type: 'primary'
  },
  {
    content: '完成设计',
    date: '2024-01-15',
    type: 'success'
  },
  {
    content: '开始开发',
    date: '2024-02-01',
    type: 'warning'
  },
  {
    content: '项目上线',
    date: '2024-03-01',
    type: 'info'
  }
]
</script>
```

## 水平时间线

```vue
<template>
  <UTimeline 
    :data="timelineData" 
    direction="horizontal" 
  />
</template>
```

## 不同圆点类型

```vue
<template>
  <UTimeline :data="timelineData" />
</template>

<script setup>
const timelineData = [
  {
    content: '主要类型',
    date: '2024-01-01',
    type: 'primary'
  },
  {
    content: '成功类型',
    date: '2024-01-15',
    type: 'success'
  },
  {
    content: '警告类型',
    date: '2024-02-01',
    type: 'warning'
  },
  {
    content: '危险类型',
    date: '2024-02-15',
    type: 'danger'
  },
  {
    content: '信息类型',
    date: '2024-03-01',
    type: 'info'
  }
]
</script>
```

## 不同圆点大小

```vue
<template>
  <UTimeline :data="timelineData" />
</template>

<script setup>
const timelineData = [
  {
    content: '默认大小',
    date: '2024-01-01',
    type: 'primary',
    size: 'default'
  },
  {
    content: '正常大小',
    date: '2024-01-15',
    type: 'success',
    size: 'normal'
  },
  {
    content: '大尺寸',
    date: '2024-02-01',
    type: 'warning',
    size: 'large'
  }
]
</script>
```

## 空心圆点

```vue
<template>
  <UTimeline :data="timelineData" />
</template>

<script setup>
const timelineData = [
  {
    content: '空心主要类型',
    date: '2024-01-01',
    type: 'primary',
    hollow: true
  },
  {
    content: '空心成功类型',
    date: '2024-01-15',
    type: 'success',
    hollow: true
  }
]
</script>
```

## 自定义图标

```vue
<template>
  <UTimeline :data="timelineData" />
</template>

<script setup>
const timelineData = [
  {
    content: '开始图标',
    date: '2024-01-01',
    type: 'primary',
    icon: 'fas fa-play'
  },
  {
    content: '进行中图标',
    date: '2024-01-15',
    type: 'success',
    icon: 'fas fa-clock'
  },
  {
    content: '完成图标',
    date: '2024-02-01',
    type: 'warning',
    icon: 'fas fa-check'
  }
]
</script>
```

## 不同位置

```vue
<template>
  <UTimeline :data="timelineData" />
</template>

<script setup>
const timelineData = [
  {
    content: '左侧位置',
    date: '2024-01-01',
    type: 'primary',
    position: 'left'
  },
  {
    content: '右侧位置',
    date: '2024-01-15',
    type: 'success',
    position: 'right'
  },
  {
    content: '居中位置',
    date: '2024-02-01',
    type: 'warning',
    position: 'center'
  }
]
</script>
```

## 不同日期位置

```vue
<template>
  <UTimeline :data="timelineData" />
</template>

<script setup>
const timelineData = [
  {
    content: '日期在上方',
    date: '2024-01-01',
    type: 'primary',
    placement: 'top'
  },
  {
    content: '日期在下方',
    date: '2024-01-15',
    type: 'success',
    placement: 'bottom'
  },
  {
    content: '日期在左侧',
    date: '2024-02-01',
    type: 'warning',
    placement: 'left'
  },
  {
    content: '日期在右侧',
    date: '2024-02-15',
    type: 'danger',
    placement: 'right'
  }
]
</script>
```

## 自定义颜色

```vue
<template>
  <UTimeline :data="timelineData" />
</template>

<script setup>
const timelineData = [
  {
    content: '自定义红色',
    date: '2024-01-01',
    type: 'primary',
    color: '#ff4757'
  },
  {
    content: '自定义蓝色',
    date: '2024-01-15',
    type: 'success',
    color: '#3742fa'
  },
  {
    content: '自定义绿色',
    date: '2024-02-01',
    type: 'warning',
    color: '#2ed573'
  }
]
</script>
```

## 点击事件

```vue
<template>
  <UTimeline :data="timelineData" />
</template>

<script setup>
const handleDotClick = (evt, item) => {
  console.log('点击了圆点:', item)
}

const timelineData = [
  {
    content: '可点击的项目一',
    date: '2024-01-01',
    type: 'primary',
    dotClick: handleDotClick
  },
  {
    content: '可点击的项目二',
    date: '2024-01-15',
    type: 'success',
    dotClick: handleDotClick
  }
]
</script>
```

## 自定义连接线颜色

```vue
<template>
  <UTimeline 
    :data="timelineData" 
    line-color="#ff6b6b"
  />
</template>
```

## API

### Timeline Props

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| data | 时间线数据 | `UTimelineItemProps[]` | `[]` |
| direction | 时间线方向 | `'vertical' \| 'horizontal'` | `'vertical'` |
| gutter | 项目间距 | `number` | `30` |
| margin | 边距 | `number` | `20` |
| lineColor | 连接线颜色 | `string` | `''` |

### TimelineItem Props

| 参数 | 说明 | 类型 | 默认值 |
|------|------|------|--------|
| content | 内容 | `string` | `''` |
| date | 日期 | `string \| Date` | `''` |
| placement | 日期位置 | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` |
| type | 圆点类型 | `'primary' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'primary'` |
| color | 圆点颜色 | `string` | `''` |
| size | 圆点大小 | `'default' \| 'normal' \| 'large'` | `'default'` |
| position | 圆点位置 | `'default' \| 'left' \| 'right' \| 'center'` | `'default'` |
| icon | 自定义图标 | `string \| Component` | `''` |
| iconProps | 图标属性 | `UIconProps` | `{}` |
| hollow | 是否空心 | `boolean` | `false` |
| dotClick | 圆点点击事件 | `(evt: MouseEvent, item: UTimelineItemProps) => void` | `() => {}` |

### TimelineItem Events

| 事件名 | 说明 | 参数 |
|--------|------|------|
| dot-click | 圆点点击事件 | `(evt: MouseEvent, item: UTimelineItemProps)` |

## 样式定制

### CSS 变量

```css
.u-timeline {
  --timeline-content-gap: var(--uc-height-6);
  --timeline-date-font-weight: var(--uc-font-weight-normal);
  --timeline-date-color: var(--uc-text-3);
  --timeline-date-font-size: var(--uc-font-size-md);
  --timeline-content-font-weight: var(--uc-font-weight-regular);
  --timeline-content-color: var(--uc-text-1);
  --timeline-content-font-size: var(--uc-font-size-base);
}
```

### 自定义样式

```vue
<template>
  <UTimeline 
    :data="timelineData" 
    class="custom-timeline"
  />
</template>

<style>
.custom-timeline {
  --timeline-content-gap: 2rem;
  --timeline-date-color: #666;
  --timeline-content-color: #333;
}

.custom-timeline .u-timeline-item-dot {
  border: 2px solid #ff6b6b;
}
</style>
```

## 注意事项

1. **性能优化**: 当时间线数据较多时，建议使用虚拟滚动或分页加载
2. **响应式**: 水平时间线在小屏幕上会自动调整为垂直布局
3. **图标**: 自定义图标需要确保 FontAwesome 图标库已正确加载
4. **日期格式**: 建议使用 `YYYY-MM-DD` 格式或 Date 对象
5. **无障碍**: 组件已内置基本的无障碍支持，包括键盘导航和屏幕阅读器支持
