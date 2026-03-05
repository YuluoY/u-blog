# 全站 AI 浮动工具栏

- **Version**: 1.0.1
- **Last Updated**: 2026-03-06
- **Code Paths**: `apps/frontend/src/components/GlobalAiToolbar.vue`, `apps/frontend/src/components/LayoutBase.vue`

## 功能目的

在网站任意**可编辑输入区域**（textarea、input[type=text/search/url/email]、contenteditable）选中文本时，弹出 AI 浮动工具栏，提供翻译、解释、润色、缩写四种 AI 操作。撰写页（WriteView）自带独立工具栏，此组件自动跳过。

## 触发条件

1. 用户已在设置抽屉面板中配置了在线模型（`OPENAI_API_KEY` 已设置）
2. 在可编辑 DOM 中选中至少 1 个字符的文本
3. 当前页面不是撰写页（WriteView）

## 使用方式

- 在留言板评论框、搜索输入、设置面板输入等任何可编辑区域选中文字
- 工具栏弹出于鼠标松开位置上方，包含：翻译 / 解释 / 润色 / 缩写
- 点击操作后，AI 生成结果面板展示，支持「复制结果」或「替换原文」
- 替换操作会直接修改输入框内容

## 关键约束与边界

- **只读文本不触发**：非 editable DOM（如标题、段落文字）选中不弹出
- **z-index: 10010**：高于 PopoverPanel (10003)、DrawerOverlay (10001)，确保在搜索面板等弹层上方显示
- **视口边界修正**：工具栏弹出后自动调整，防止左/右/顶超出视口
- **AI 配置实时感知**：监听 `u-blog:settings-saved` 自定义事件，用户保存模型设置后立即刷新配置状态
- **selectionchange 延迟隐藏**：选区清空后 200ms 隐藏工具条，避免闪烁

## 文件说明

| 文件 | 说明 |
|------|------|
| `GlobalAiToolbar.vue` | 核心组件，监听 document mouseup/selectionchange，渲染工具栏与结果面板 |
| `LayoutBase.vue` | 引入 `<GlobalAiToolbar v-if="!isWriteRoute" />` |
| `locales/zh/index.ts` | 中文 i18n（copyResult, replaceText 等） |
| `locales/en/index.ts` | 英文 i18n |
| `composables/useSettingsForm.ts` | 保存模型设置后 dispatch settings-saved 事件 |
| `views/SettingView.vue` | 同上，保存后 dispatch 事件 |

## Changelog

- `2026-03-06` **Feat**: 新增全站 AI 浮动工具栏，支持 textarea/input/contenteditable 选中文本弹出
- `2026-03-06` **Fix**: 修复 textarea 类型判断遗漏导致工具栏不弹出的问题（isTextInput 不覆盖 textarea）
- `2026-03-06` **Fix**: 工具栏定位改为鼠标坐标，贴近选中文本而非输入框顶部
- `2026-03-06` **Fix**: z-index 从 1080 提升至 10010，修复被搜索面板（PopoverPanel z:10003）遮盖问题
- `2026-03-06` **Fix**: 新增视口边界修正（adjustToolbarPosition），防止左侧/右侧/顶部溢出
