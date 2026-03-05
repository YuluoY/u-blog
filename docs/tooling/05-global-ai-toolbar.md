# 全站 AI 浮动工具栏

- **Version**: 2.0.0
- **Last Updated**: 2026-03-07
- **Code Paths**: `apps/frontend/src/components/GlobalAiToolbar.vue`, `apps/frontend/src/components/LayoutBase.vue`, `apps/frontend/src/constants/aiProviders.ts`, `apps/frontend/src/utils/guestCrypto.ts`, `apps/frontend/src/composables/useSettingsForm.ts`, `apps/frontend/src/views/SettingView.vue`, `apps/backend/src/router/common/index.ts`

## 功能目的

在网站任意**可编辑输入区域**（textarea、input[type=text/search/url/email]、contenteditable）选中文本时，弹出 AI 浮动工具栏，提供翻译、解释、润色、缩写、**扩写、续写**六种 AI 操作，点击后**直接替换选中内容**。撰写页（WriteView）自带独立工具栏，此组件自动跳过。

## 触发条件

1. **登录用户**：在设置页/抽屉中配置了在线模型（`OPENAI_API_KEY` 已设置）
2. **游客**：在设置抽屉中配置了自备 API Key（加密存储于 localStorage）
3. 在可编辑 DOM 中选中至少 1 个字符的文本
4. 当前页面不是撰写页（WriteView）

## 使用方式

- 在留言板评论框、搜索输入、设置面板输入等任何可编辑区域选中文字
- 工具栏弹出于**选中区域正下方**（水平居中于实际选区），包含：翻译 / 解释 / 润色 / 缩写 / 扩写 / 续写
- 点击操作后，工具栏切换为 loading 态（旋转图标 + 文字提示）
- AI 生成完成后**直接替换选中文本**，并通过 UMessage toast 提示「已替换」

## 游客 AI 功能

### 流程
1. 游客打开设置抽屉 → 在线模型 tab 显示「游客模式」提示
2. 选择厂商（DeepSeek / Qwen / GLM / MiniMax / Doubao / 自定义）→ 自动填入 baseUrl
3. 输入自己的 API Key → 选择模型 → 保存
4. 配置通过 Web Crypto API（PBKDF2 + AES-256-GCM）加密后存入 localStorage
5. 使用 AI 工具栏时，前端将解密后的 API Key 通过 `config.apiKey` 内联传给后端
6. 后端 `/ai/generate` 路由允许无登录但携带 `config.apiKey` 的请求

### 安全机制
- 浏览器指纹（userAgent + language + screen + timezone）作为 PBKDF2 密码
- 100,000 次 PBKDF2 迭代 + 随机盐 + AES-256-GCM 加密
- localStorage key: `u-blog:guest-ai-config`
- API Key 仅在内存中短暂存在，不以明文持久化

## 厂商预设下拉

### 支持的厂商

| 厂商 | Base URL | 默认模型 |
|------|----------|----------|
| DeepSeek | `https://api.deepseek.com/v1` | deepseek-chat |
| Qwen (通义千问) | `https://dashscope.aliyuncs.com/compatible-mode/v1` | qwen3.5-plus |
| GLM (智谱清言) | `https://open.bigmodel.cn/api/paas/v4` | glm-4-plus |
| MiniMax | `https://api.minimax.chat/v1` | MiniMax-M2.5 |
| 豆包 (Doubao) | `https://ark.cn-beijing.volces.com/api/v3` | doubao-seed-1-6-251015 |

### 使用位置
- **SettingsDrawer**（设置抽屉）：厂商按钮网格 + 模型按钮网格
- **SettingView**（设置页面）：同上，3 列网格布局
- 选择厂商后自动填入 baseUrl 和默认模型，支持手动切换「自定义」模式

## 视口边界检测

### UFloatingToolbar（撰写页）
- 弹出后通过 `adjustPosition()` 检测四个方向溢出
- 左/右溢出：水平平移回视口内
- 底部溢出：翻转到选区上方（`--flipped` modifier）
- 顶部溢出：翻转回下方

### GlobalAiToolbar（全站）
- 相同的 `adjustToolbarPosition()` 逻辑
- 底部溢出时翻转到选区上方，CSS `--flipped` modifier 控制箭头方向

## 关键约束与边界

- **只读文本不触发**：非 editable DOM（如标题、段落文字）选中不弹出
- **z-index: 10010**：高于 md-editor-v3 全屏（10000）、PopoverPanel (10003)、DrawerOverlay (10001)
- **视口边界修正**：工具栏弹出后自动调整，防止左/右/底超出视口（溢出时翻转方向）
- **AI 配置实时感知**：监听 `u-blog:settings-saved` 自定义事件，用户保存模型设置后立即刷新配置状态
- **selectionchange 延迟隐藏**：选区清空后 200ms 隐藏工具条，避免闪烁
- **直接替换**：textarea/input 通过 `execCommand('insertText')` 替换（兼容 v-model 双向绑定），contenteditable 同理
- **游客与登录双模式**：后端 `/ai/generate` 支持无 session 但携带 `config.apiKey` 的请求

## 文件说明

| 文件 | 说明 |
|------|------|
| `GlobalAiToolbar.vue` | 核心组件，监听 document mouseup/selectionchange，渲染工具栏 |
| `LayoutBase.vue` | 引入 `<GlobalAiToolbar v-if="!isWriteRoute" />` |
| `constants/aiProviders.ts` | 5 家厂商预设（DeepSeek/Qwen/GLM/MiniMax/Doubao）+ 工具函数 |
| `utils/guestCrypto.ts` | Web Crypto API 加密/解密游客 AI 配置 |
| `composables/useSettingsForm.ts` | 设置抽屉逻辑，含厂商选择 + 游客/登录分支 |
| `views/SettingView.vue` | 设置页面，独立厂商选择 + 模型网格 |
| `components/AppShell/SettingsDrawer.vue` | 设置抽屉 UI，厂商按钮 + 模型按钮 |
| `locales/zh/index.ts` | 中文 i18n |
| `locales/en/index.ts` | 英文 i18n |
| `backend/router/common/index.ts` | `/ai/generate` 路由（移除 requireAuth，内联鉴权） |

## Changelog

- `2026-03-06` **Feat**: 新增全站 AI 浮动工具栏，支持 textarea/input/contenteditable 选中文本弹出
- `2026-03-06` **Fix**: 修复 textarea 类型判断遗漏导致工具栏不弹出的问题（isTextInput 不覆盖 textarea）
- `2026-03-06` **Fix**: 工具栏定位改为鼠标坐标，贴近选中文本而非输入框顶部
- `2026-03-06` **Fix**: z-index 从 1080 提升至 10010，修复被搜索面板（PopoverPanel z:10003）遮盖问题
- `2026-03-06` **Fix**: 新增视口边界修正（adjustToolbarPosition），防止左侧/右侧/顶部溢出
- `2026-03-07` **Fix**: textarea/input 定位改为输入框水平居中（`inputRect.width / 2`），与 contenteditable 行为保持一致
- `2026-03-07` **Update**: 工具栏改为选区正下方弹出（不再遮盖选中内容），使用镜像 div 精确测量 textarea/input 内选区位置
- `2026-03-07` **Update**: 移除结果面板，AI 生成后直接替换选中文本 + toast 提示
- `2026-03-07` **Fix**: UFloatingToolbar z-index 从 1080 提升至 10010，修复 md-editor-v3 全屏模式下被遮盖
- `2026-03-07` **Feat**: 两端工具栏均新增完整视口边界检测（上/下/左/右），底部溢出自动翻转到选区上方
- `2026-03-07` **Feat**: GlobalAiToolbar 新增扩写（expand）和续写（continue）操作
- `2026-03-07` **Feat**: 游客 AI 功能——未登录用户可自备 API Key 使用工具栏，配置通过 PBKDF2+AES-256-GCM 加密存 localStorage
- `2026-03-07` **Feat**: 新增 5 家国内大模型厂商预设下拉（DeepSeek/Qwen/GLM/MiniMax/Doubao），自动填入 baseUrl 与模型
- `2026-03-07` **Feat**: SettingsDrawer 和 SettingView 均支持厂商网格选择 + 模型按钮切换
