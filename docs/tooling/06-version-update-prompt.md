Version: 1.0.0
Last Updated: 2026-03-08
Code Paths: apps/frontend/src/composables/useVersionCheck.ts, apps/frontend/src/components/UpdateToast.vue, apps/frontend/vite.config.mts
Owner: 

# 站点更新提示检测机制

## 功能目的
在网站发布新版本后，让仍停留在旧页面的用户更快看到“发现新版本”的刷新提示。

## 使用方式/入口
- 前端入口：全局组件 [apps/frontend/src/components/UpdateToast.vue](apps/frontend/src/components/UpdateToast.vue)
- 检测逻辑：`useVersionCheck()` 定时拉取 `/version.json`，对比当前构建哈希与远端哈希
- 构建入口：Vite 构建后输出 `version.json`，包含 `hash` 与 `buildTime`

## 关键约束与边界
- 只有“旧页面仍停留在线上”时，部署新版本后才会出现更新提示；如果用户已经刷新到最新版本，就不会再提示。
- 版本检测仅在生产环境运行。
- 为避免首屏阻塞，请求不会在页面初始化瞬间发送，而是在短延迟后发起。
- 额外监听标签页重新可见、窗口重新聚焦、网络恢复，尽量缩短用户感知新版本的时间。

## Changelog
- 2026-03-08 **Feat**: 新增站点更新提示检测机制说明文档
- 2026-03-08 **Update**: 版本检测首次轮询由 30 秒缩短到 5 秒，常规轮询由 5 分钟缩短到 1 分钟
- 2026-03-08 **Update**: 新增窗口聚焦与网络恢复时主动检测版本