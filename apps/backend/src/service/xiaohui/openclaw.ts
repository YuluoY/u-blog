/** OpenClaw 网关配置 */
export interface XiaohuiOpenClawConfig {
  url: string
  token: string
  model: string
}

const DEFAULT_OPENCLAW_URL = 'http://127.0.0.1:18789'
const DEFAULT_OPENCLAW_MODEL = 'default'

/**
 * 解析小惠使用的 OpenClaw 网关配置。
 * 这里统一约束默认值与 URL 规范化，避免状态检查和真正发请求时各自维护一套配置逻辑。
 */
export function resolveXiaohuiOpenClawConfig(
  env: NodeJS.ProcessEnv = process.env
): XiaohuiOpenClawConfig {
  const rawUrl = (env.OPENCLAW_URL || DEFAULT_OPENCLAW_URL).trim()
  const rawModel = (env.OPENCLAW_MODEL || DEFAULT_OPENCLAW_MODEL).trim()

  return {
    url: rawUrl.replace(/\/+$/, ''),
    token: (env.OPENCLAW_TOKEN || '').trim(),
    model: rawModel || DEFAULT_OPENCLAW_MODEL,
  }
}

/**
 * 构建 OpenClaw 请求头。
 * Token 为空时不强制注入 Authorization，便于兼容未开启鉴权的本地网关。
 */
export function buildXiaohuiOpenClawHeaders(token: string): Record<string, string> {
  if (!token) {
    return {
      'Content-Type': 'application/json',
    }
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}
