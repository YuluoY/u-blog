# 蜂窝状友链高级动效系统

- **Version**: 1.0.0
- **Last Updated**: 2026-03-10
- **Code Paths**: `apps/frontend/src/views/FriendLinksView.vue`, `apps/frontend/src/composables/useHoneycombGrid.ts`

## 功能目的

将友链页面从基础蜂窝布局升级为企业级高级动效系统，具备：邻近节点联动、状态驱动交互、入场 stagger 动画、性能优化策略与完整可访问性支持。

## 架构

### Composable: `useHoneycombGrid`

核心交互逻辑抽离为独立 composable，职责：

| 功能 | 说明 |
|------|------|
| 网格布局 | 响应式六边形偏移行排列，自动计算行列位置 |
| 邻居预计算 | 基于行列坐标一次性构建 `neighborMap`（一阶六方向），hover 时 O(1) 查询 |
| 状态系统 | `getNodeState(id)` 返回 6 种状态之一 |
| 入场距离 | `normalizedDist` 归一化距离（0–1），用于从中心向外 stagger |
| 事件处理 | 统一封装 enter/leave/press/focus/click，含触控/桌面自适应 |

### 状态枚举

| State | 触发条件 | 视觉表现 |
|-------|----------|----------|
| `idle` | 无交互 | 基础静止态 + 微呼吸 |
| `hovered` | 鼠标悬浮 | scale 1.028 + translateY -4px + 阴影增强 + glow |
| `near` | 被 hover 节点的一阶邻居 | scale 1.008 + 边框微亮 + 延迟 30ms |
| `pressed` | 鼠标按下 | scale 0.99 + 阴影收紧，80ms 响应 |
| `focus-visible` | 键盘 Tab 聚焦 | 类似 hover + 高对比 focus ring |
| `dimmed` | 有节点被 hover/focus 但自己不相关 | opacity 0.72 退让 |

### CSS 变量体系

所有动画参数通过 CSS Variables 集中管理，便于主题切换与微调：

```
--hex-ease                → cubic-bezier(0.22, 1, 0.36, 1)
--hex-hover-duration      → 160ms
--hex-leave-duration      → 200ms
--hex-press-duration      → 80ms
--hex-scale-hover         → 1.028
--hex-scale-press         → 0.99
--hex-translate-hover     → -4px
--hex-shadow-idle/hover/press
--hex-glow-opacity
--hex-border-opacity
--hex-enter-delay         → 动态：0–400ms（基于中心距离）
--hex-breathe-delay       → 动态：错峰呼吸
```

## 性能策略

1. **动画属性限制**：核心动画仅使用 `transform`、`opacity`、`filter: drop-shadow`
2. **邻居预计算**：`neighborMap` 在 `computed` 中一次性构建，hover 时 O(1) 查询
3. **无 will-change 常驻**：不给所有节点设置 will-change，由浏览器合成层自动管理
4. **hover 延迟隐藏**：150ms 防抖，避免快速穿越时频繁闪动
5. **入场动画**：用 CSS `transition` + `is-entered` 类名驱动，避免 JS 动画循环
6. **移动端降级**：关闭邻近联动、背景氛围、微呼吸动画

## 可访问性

- `prefers-reduced-motion`：关闭所有动画，保留基本视觉反馈（边框 + 透明度）
- 键盘导航：所有节点 `tabindex="0"`，Enter/Space 触发跳转
- Focus ring：`data-state="focus-visible"` 提供高对比度 primary 色边框
- 语义化 `<a>` 标签 + `rel="noopener noreferrer"`

## 关键约束

- 六边形使用 `clip-path: polygon()` 渲染，边框通过双层结构（border 层 + hex 层 inset 1px）实现
- 移动端禁用桌面端 tooltip，改用底部固定详情面板
- 微呼吸动画周期 6s，节点间错峰间隔 800ms，幅度仅 3.5% 透明度浮动

---

#### Changelog

- `2026-03-10` **Feat**: 蜂窝友链系统全面升级 — 邻近联动、状态驱动、入场 stagger、性能优化、a11y 支持
