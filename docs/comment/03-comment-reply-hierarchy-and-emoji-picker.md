Version: 1.0.8
Last Updated: 2026-03-06
Code Paths: apps/frontend/src/views/ReadView.vue, apps/frontend/src/views/MessageView.vue, apps/frontend/src/utils/commentScroll.ts, packages/ui/src/components/comment/src/CommentList.vue, packages/ui/src/components/comment/src/CommentItem.vue, packages/ui/src/components/comment/src/CommentInput.vue, packages/ui/src/components/comment/src/utils.ts, packages/ui/src/components/comment/styles/index.scss
Owner: GitHub Copilot

# 评论区回复层级与表情面板样式修复

## 功能目的
修复评论工具栏表情面板缺少样式的问题，并强化评论二级/三级回复的视觉层级区分与 @ 定位交互，统一收敛回复定位与名称高亮逻辑。

## 使用方式/入口
- 文章评论区：`/read/:id`
- 留言页评论区：`/message`
- 二级及更深回复会通过缩进区分层级，不再增加背景块或边框。
- 三级及更深回复会显示可点击的 `回复 @某人` 入口，点击后在主滚动容器内平滑定位到目标评论，并自动高亮。
- 表情按钮点击后会展示带完整第三方样式的表情选择面板。

## 关键约束与边界
- 评论树在渲染时会保留真实回复深度，二级回复为 `depth=1`，三级及以上回复为 `depth>=2`。
- 定位滚动基于 `.layout-base__main` 容器计算，同时检测顶部导航与滚动容器的遮挡关系，避免目标评论被顶部区域盖住。
- 回复标签点击后的高亮由前端统一滚动控制器管理：会先等待平滑滚动稳定，再只高亮目标用户名，并自动清理上一次高亮状态。
- 表情选择器样式被合并进评论组件样式产物，避免仅引入组件样式时丢失第三方 CSS。

## Changelog
- 2026-03-06 **Fix**: 修复评论工具栏表情面板缺少样式的问题。
- 2026-03-06 **Update**: 为二级回复增加独立卡片层级样式，并强化三级回复的串联回复表现。
- 2026-03-06 **Fix**: 点击三级回复 `@用户` 时在主滚动容器内按顶部遮挡补偿进行定位并高亮目标评论。
- 2026-03-06 **Test**: 新增评论回复深度扁平化工具测试。
- 2026-03-06 **Update**: 将回复项样式调整为仅保留缩进，不再使用边框或背景块区分。
- 2026-03-06 **Update**: 回复定位标签取消整块背景高亮，改为仅高亮被回复用户名，并进一步增大左侧缩进。
- 2026-03-06 **Fix**: 恢复回复标签原有高亮样式，同时将点击定位后的高亮目标改为被回复人的名称而非整条评论背景。
- 2026-03-06 **Fix**: 点击回复标签后，直接对被回复用户名施加高亮样式，避免评论项背景或标签本身被误高亮。
- 2026-03-06 **Fix**: 点击回复标签时移除 hash 锚点跳转，仅保留主滚动容器内的平滑定位与用户名高亮。
- 2026-03-06 **Refactor**: 将评论定位与高亮逻辑统一收敛到前端滚动控制器，移除组件内联样式与 hash 依赖，增强重复点击、多次跳转与降级场景稳定性。
