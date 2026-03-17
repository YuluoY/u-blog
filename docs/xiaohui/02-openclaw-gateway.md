Version: 1.0.0
Last Updated: 2026-03-17
Code Paths: apps/backend/src/service/xiaohui/index.ts, apps/backend/src/service/xiaohui/openclaw.ts, apps/backend/src/router/xiaohui/index.ts, apps/backend/src/service/xiaohui/openclaw.test.ts
Owner:

# 小惠 OpenClaw 网关接入

## 功能目的
将小惠对话从业务代码里直接请求 DeepSeek 改为统一走服务器本地 OpenClaw 网关，避免在仓库中硬编码第三方供应商地址与密钥，并让线上部署只依赖后端环境变量。

## 使用方式/入口
- 对话入口仍为 `POST /xiaohui/chat`，前端调用方式不变。
- 服务状态入口仍为 `GET /xiaohui/status`，改为与真正的对话调用共用同一份 OpenClaw URL 解析逻辑。
- 后端环境变量：
  - `OPENCLAW_URL`：网关地址，默认 `http://127.0.0.1:18789`
  - `OPENCLAW_TOKEN`：可选鉴权 token；有值时通过 `Authorization: Bearer <token>` 发送
  - `OPENCLAW_MODEL`：发送给网关的模型名，默认 `default`

## 关键约束与边界
- 小惠业务代码不再内置 DeepSeek URL、API Key 或供应商专用常量。
- 若 OpenClaw 未开启鉴权，可不配置 `OPENCLAW_TOKEN`；若网关要求鉴权，则必须由后端 `.env` 提供 token。
- 业务侧只依赖 OpenAI 兼容的 `/v1/chat/completions` 接口，不假设网关一定实现 `/v1/models`。
- 前端设置面板中的 `openai_*` 配置仍属于通用聊天链路；本次改动只替换小惠的后端网关接入方式。

## Changelog
- 2026-03-17 **Update**: 小惠对话改为统一通过 OpenClaw 本地网关转发模型请求
- 2026-03-17 **Fix**: 移除小惠服务中硬编码的 DeepSeek URL 与 API Key
- 2026-03-17 **Test**: 新增 OpenClaw 配置解析与请求头构建回归测试
