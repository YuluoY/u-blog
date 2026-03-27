# 系统管理中的数据计数维护与备份导出

## 功能目的

后台系统管理新增两类运维能力：

1. 数据计数维护
用于审计文章点赞数、文章评论数、评论点赞数这三类冗余计数字段，确认它们是否与数据库真实明细保持一致，并在发现漂移时执行一键修复。

2. 博客备份与导出
用于手动导出博客相关数据，统一覆盖数据库实体表数据、`public/uploads`、`public/static`，生成可下载的 `tar.gz` 归档。

这样可以同时解决两个长期问题：

- 后台展示的统计值与数据库真实数据不一致时，管理员缺少可观测与修复入口。
- 缺少"手动做一份完整博客备份并下载"的统一能力。

## 使用入口

- 后台系统管理页：`/admin/system`
- 后端接口：
  - `GET /system/data/counters`
  - `POST /system/data/counters/repair`
  - `GET /system/backups`
  - `POST /system/backups`
  - `GET /system/backups/download?name=...`

## 关键约束与边界

### 计数审计与修复

- 审计对象包括：
  - `article.likeCount`
  - `article.commentCount`
  - `comment.likeCount`
- 实际值来源包括：
  - `"like"` 表中的文章点赞明细
  - `comment` 表中的未删除评论明细
  - `"like"` 表中的评论点赞明细
- 修复动作会按真实明细重算上述冗余字段，并清除 `site-overview` 缓存。
- `article.viewCount` 不在一键修复范围内。
原因：
文章阅读量当前有按 IP 的去重窗口，历史日志并不是“无损点击明细”，不能安全地用日志反推并覆盖文章阅读数。

### 站点总浏览 / 访客

- 后台审计页展示的站点总浏览与站点访客使用 `activity_log.type = 'page_view'` 聚合。
- 其中：
  - 总浏览 = `page_view` 总条数
  - 访客 = `page_view` 中按 IP 去重后的数量

### 备份导出

- 备份使用逻辑导出，而不是数据库物理快照。
- 当前备份内容包括：
  - 所有 TypeORM 实体表的 JSON 数据
  - `public/uploads`
  - `public/static`
- 备份文件存放在 backend 工作目录下的 `backups/`。

## Changelog

- Fix: 新增后台“数据计数维护”面板，支持审计文章点赞、文章评论、评论点赞与真实明细的一致性。
- Fix: 新增计数一键修复接口，按数据库真实明细重算冗余字段。
- Feat: 新增后台“博客备份与导出”面板，支持创建、查看、下载手动备份。

