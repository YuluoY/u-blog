Version: 1.0.0
Last Updated: 2026-03-09
Code Paths: apps/frontend/src/components/WriteSaveForm.vue, apps/frontend/src/views/WriteView.vue, apps/frontend/src/views/ReadView.vue, apps/frontend/src/views/WriteSuccessView.vue, apps/frontend/src/api/article.ts, apps/frontend/src/stores/model/article.ts, apps/backend/src/router/rest/index.ts, apps/backend/src/service/common/index.ts
Owner:

# 撰写同步与私密文章访问限制

## 功能目的
修复撰写页正文标题、简介在打开发布抽屉时未及时同步的问题，并阻止私密文章通过阅读路由直接访问。

## 使用方式/入口
- 入口一：撰写页 /write，点击发布或更新按钮打开右侧抽屉。
- 入口二：阅读页 /read/:id。

当前行为：
- 每次打开发布抽屉，都会根据当前 Markdown 正文重新同步标题与简介。
- 阅读页进入时会主动请求“公开文章详情”，仅已发布且非私密文章可读取。
- 私密文章的浏览量、点赞状态、密码验证等公共接口也会拒绝访问。

## 关键约束与边界
- 编辑页仍保留作者通过编辑接口读取私密/草稿文章的能力，避免影响继续修改。
- 阅读页不再复用编辑态详情接口，避免通过手输路由读取私密文章。
- 私密或草稿文章保存成功后，不再强制跳转阅读页；创建成功页也会隐藏“阅读文章”按钮。

## Changelog
- 2026-03-09 **Fix**: 修复发布抽屉标题和简介未随当前正文及时同步的问题
- 2026-03-09 **Fix**: 修复私密文章仍可通过阅读路由访问的问题
- 2026-03-09 **Update**: 新增公开文章详情接口，并收紧浏览量、点赞、密码验证的私密文章访问条件
- 2026-03-09 **Doc**: 新增撰写同步与私密文章访问限制说明