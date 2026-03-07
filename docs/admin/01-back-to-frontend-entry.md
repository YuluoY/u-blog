# 后台返回前台入口

- Version: 1.0.0
- Last Updated: 2026-03-07
- Code Paths: apps/admin/src/layouts/AdminLayout.tsx, apps/admin/src/features/auth/AuthContext.tsx, apps/admin/src/locales/zh.ts, apps/admin/src/locales/en.ts
- Owner: Admin

## 功能目的
为后台管理头部增加一个显式的返回前台入口，减少管理员在后台与站点之间来回切换时的操作成本。

## 使用方式/入口
- 入口位置：后台头部操作区
- 交互方式：点击“返回前台 / Back to site”按钮
- 跳转目标：前台站点首页

## 关键约束与边界
- 跳转地址统一复用前台地址配置，避免后台和登录回跳地址不一致。
- 开发环境默认跳转到 `http://localhost:5173`。
- 生产环境默认跳转到当前域名根路径；如配置 `VITE_FRONTEND_URL`，则优先使用该值。
- 该入口对游客模式、管理员、超级管理员均可见。

## Changelog
- 2026-03-07 **Feat**: 在后台头部新增返回前台按钮，支持一键跳转前台首页。
- 2026-03-07 **Doc**: 补充后台返回前台入口说明文档。
