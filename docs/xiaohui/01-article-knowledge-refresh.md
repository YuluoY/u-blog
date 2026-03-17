Version: 1.0.0
Last Updated: 2026-03-10
Code Paths: apps/backend/src/controller/rest/index.ts, apps/backend/src/service/xiaohui/blogKnowledge.ts, apps/backend/src/service/xiaohui/blogContext.ts, apps/frontend/src/views/XiaohuiView.vue
Owner:

# 小惠文章知识库刷新

## 功能目的
确保小惠对话查询博客文章时，能够及时看到刚发布、刚更新或刚删除后的最新文章数据，避免发布成功后短时间内仍回答旧结果。

## 使用方式/入口
- 入口一：前台小惠对话页 /xiaohui，询问“最近发布了什么新文章？”、“有哪些新文章？”等。
- 入口二：后台或撰写页通过 /rest/article/add、/rest/article/update、/rest/article/del 修改文章。
- 入口三：分类、标签通过 /rest/category/*、/rest/tag/* 修改后，小惠按分类/标签查询文章。

当前行为：
- 小惠文章问答走后端 blogKB 内存知识库，不直接逐次查数据库。
- 文章、分类、标签写操作成功后，会立即触发 blogKB 刷新。
- 因此“最新文章”“分类文章”“标签文章”等问答不再依赖 5 分钟自动刷新窗口。
- “最近发布了什么新文章”“最近更新了哪些文章”这类自然语言问法，也会命中最新文章意图并走知识库回答。

## 关键约束与边界
- 小惠知识库只收录 status=published 且 isPrivate=false 的文章，草稿和私密文章不会出现在回答中。
- comment、setting 等非文章元数据变更不会触发小惠知识库刷新。
- blogKB 仍保留定时自动刷新作为兜底，但正常发布链路以写后主动刷新为主。

## Changelog
- 2026-03-17 **Fix**: 修复“最近发布了什么新文章”这类自然语言问法未命中最新文章意图，导致小惠误答未获取到博客数据的问题
- 2026-03-10 **Fix**: 修复小惠对话在文章刚发布后短时间内查不到最新文章的问题
- 2026-03-10 **Update**: 文章、分类、标签写操作成功后同步刷新小惠内存知识库
- 2026-03-10 **Fix**: 为小惠和通用聊天 SSE 请求禁用压缩并在每次推流后主动 flush，恢复前端打字机效果
- 2026-03-10 **Doc**: 新增小惠文章知识库刷新说明文档
