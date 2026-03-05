# UI 组件库按需加载

- **Version**: 1.0.1
- **Last Updated**: 2026-03-06
- **Code Paths**: `packages/ui/`, `apps/frontend/src/plugins/ui.ts`, `apps/frontend/src/main.ts`

## 功能目的

将 `@u-blog/ui` 组件库从全量打包导入改为按需加载（组件 + 样式 + 图标），减少构建产物体积并为未来 tree-shaking 打下基础。

## 改动概览

### 1. UI 库构建产物重构

| 维度 | 改造前 | 改造后 |
|------|--------|--------|
| JS 文件数 | 203 (manualChunks 拆分，含 3 份 vendor 重复) | 2 (index.js + index.css) |
| JS 总体积 | ~4.6 MB | ~1.3 MB |
| CSS 产物 | 1 个全量 index.css (118 KB) | index.css (120 KB) + base.css (25 KB) + 40 个组件 style.css (~196 KB) |
| dist 总体积 | ~4.8 MB | ~1.5 MB (**-69%**) |

### 2. Frontend 消费方式变更

| 维度 | 改造前 | 改造后 |
|------|--------|--------|
| 组件注册 | `import UccUI from '@u-blog/ui'` 全量 | `plugins/ui.ts` 按需 import 32 个组件 |
| 样式导入 | `import '@u-blog/ui/dist/es/index.css'` 全量 | `base.css` + 32 个组件 `style.css` |
| 图标加载 | UI 库内部 `library.add()` 全量注册 | Frontend 内 `library.add()` 按需注册 106 solid + 6 regular + 25 brands |
| 初始 CSS | 159 KB (vendor-core) | 127→130 KB (vendor-core) |

### 3. 文件变更清单

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `packages/ui/scripts/build-css.mjs` | 新增 | 独立 CSS 构建脚本，使用 sass compile API 编译 base.css + 40 个组件 style.css |
| `packages/ui/vite.es.config.ts` | 修改 | 移除 manualChunks、设置 emptyOutDir: true |
| `packages/ui/src/core/index.ts` | 修改 | 移除 theme import 副作用 + FontAwesome 全量注册 |
| `packages/ui/package.json` | 修改 | 新增 build:css 脚本、base.css 导出、sideEffects 声明 |
| `apps/frontend/src/plugins/ui.ts` | 新增 | 集中管理：组件注册 + 按需 CSS + FontAwesome 图标 |
| `apps/frontend/src/main.ts` | 修改 | 切换到 `import UccUI from './plugins/ui'` |
| `apps/frontend/package.json` | 修改 | 新增 @fortawesome/* 依赖 |

## 使用方式

### 新增组件
在 `apps/frontend/src/plugins/ui.ts` 中：
1. 添加组件 CSS import（第 2 节）
2. 添加组件 named import（第 3 节）
3. 添加到 `components` 对象（第 5 节）

### 新增图标
在 `apps/frontend/src/plugins/ui.ts` 中：
1. 从对应 FA 包 import 图标
2. 添加到 `library.add()` 调用

### 构建 UI 库
```bash
pnpm --filter @u-blog/ui build
# 依次执行: build:es → build:umd → build:css → copy-package → generate-components-dts
```

## 关键约束

- CSS 构建使用自定义 npm importer 解析 `normalize.css` 等 bare specifier
- 组件注册使用 `app.use()` 而非 `app.component()`，以触发 `withInstall` 的 `onBeforeInstall` 回调（如 UTooltip 创建 #u-popper-container）
- `sideEffects: ["*.css"]` 确保 CSS 不被 tree-shaking 误删

## Changelog
- `2026-03-06` **Fix**: 补充 `toolbar/style.css` 按需导入，修复 UFloatingToolbar 内嵌 UToolbar 样式缺失导致撰写页浮动工具栏无样式问题
- `2026-03-05` **Feat**: UI 组件库按需加载（组件/样式/图标），dist 体积 -69%
