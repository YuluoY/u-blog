# 前后台主题色同步

- Version: 1.0.0
- Last Updated: 2026-03-07
- Code Paths: apps/admin/src/contexts/ThemeContext.tsx, apps/admin/src/styles/theme.ts, apps/admin/index.html
- Owner: Admin

## 功能目的
让后台管理与前台站点在品牌主色和亮暗主题状态上保持一致，减少前后台切换时的视觉割裂感。

## 使用方式/入口
- 前台切换明暗主题后，后台会优先读取前台的主题存储并跟随显示。
- 后台切换明暗主题后，也会同步写入前台主题存储。
- 后台 Ant Design 主色已调整为与前台一致的品牌蓝。

## 关键约束与边界
- 后台本地存储键：`u-blog-admin-theme`
- 前台本地存储键：`u-blog-theme`
- 后台读取顺序：优先自身存储，缺失时回退前台存储。
- 前台 `default` 主题在后台等价为 `light`。
- 本次同步的是亮暗主题状态与品牌主色，不包含前台全部 CSS 变量体系。

## Changelog
- 2026-03-07 **Feat**: 后台支持读取并同步前台主题状态，实现前后台亮暗主题联动。
- 2026-03-07 **Update**: 后台主色调整为与前台一致的品牌蓝 `#007bff`。
- 2026-03-07 **Doc**: 补充前后台主题同步说明文档。
