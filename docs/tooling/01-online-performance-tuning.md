# 线上性能优化与排障（站点打开卡顿）

- Version: 1.0.0
- Last Updated: 2026-03-03
- Code Paths:
  - `deploy/nginx/u-blog.conf`
  - `apps/frontend/src/components/AppShell/SidePanel.vue`
  - `apps/frontend/src/components/AppShell/PopoverPanel.vue`
- Owner: 平台工程

## 功能目的
针对“线上打开卡顿”进行快速定位与修复，优先优化首屏请求链路与 API 代理策略，并给出数据库侧提速动作。

## 使用方式/入口
- Nginx 配置：`deploy/nginx/u-blog.conf`
- 前端侧边栏按需加载：`SidePanel.vue`、`PopoverPanel.vue`
- 线上执行（服务器）：
  1. 替换并校验 Nginx 配置：`nginx -t`
  2. 平滑重载：`nginx -s reload`
  3. 执行数据库索引 SQL（见下文）

## 已落地优化
1. API 代理缓冲策略拆分：
   - `/api/chat`（SSE）保持 `proxy_buffering off`
   - 普通 `/api/` 开启 `proxy_buffering on` + `proxy_request_buffering on`
2. 前端侧栏重组件按需加载：
   - `CalendarPanel`、`TagsPanel`、`SiteInfoPanel` 改为异步组件
   - Popover 中除搜索面板外改为异步组件，保留搜索输入聚焦能力

## 数据库关键优化（必须执行）
当前高频查询依赖 `article` 与 `view` 表过滤/排序，建议在 PostgreSQL 执行以下索引：

```sql
-- 首页/归档核心筛选与排序
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_article_status_private_created_at
ON article (status, "isPrivate", "createdAt" DESC);

-- 子博客模式（按 userId 过滤）
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_article_user_status_private_created_at
ON article ("userId", status, "isPrivate", "createdAt" DESC);

-- 热门/点赞排序
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_article_status_private_view_count
ON article (status, "isPrivate", "viewCount" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_article_status_private_like_count
ON article (status, "isPrivate", "likeCount" DESC);

-- 访问去重与 UV 聚合
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_view_ip_article_created_at
ON view (ip, "articleId", "createdAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_view_ip
ON view (ip);
```

## 关键约束与边界
- `proxy_buffering off` 仅应保留在流式接口（SSE/WebSocket）上，普通 JSON 接口关闭缓冲会降低吞吐。
- 本仓库生产环境 `synchronize=false`，实体上新增索引装饰器不会自动落库，必须通过 SQL/Migration 执行。
- 若接入 Cloudflare，请同时核查缓存规则与回源延迟（TTFB）。

## Changelog
- 2026-03-03 **Perf**: 拆分 API 代理缓冲策略，SSE 与普通 JSON 路由分离。
- 2026-03-03 **Perf**: 侧边栏/弹出面板重组件改为异步加载，降低首屏主包压力。
- 2026-03-03 **Doc**: 新增线上性能排障与数据库索引执行指引。
