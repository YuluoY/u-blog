import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  buildXiaohuiOpenClawHeaders,
  resolveXiaohuiOpenClawConfig,
} from './openclaw'

test('resolveXiaohuiOpenClawConfig 使用本地网关默认值', () => {
  const config = resolveXiaohuiOpenClawConfig({})

  assert.equal(config.url, 'http://127.0.0.1:18789')
  assert.equal(config.token, '')
  assert.equal(config.model, 'default')
})

test('resolveXiaohuiOpenClawConfig 会裁剪 URL 末尾斜杠并保留显式配置', () => {
  const config = resolveXiaohuiOpenClawConfig({
    OPENCLAW_URL: 'http://10.0.0.8:18789/',
    OPENCLAW_TOKEN: 'token-123',
    OPENCLAW_MODEL: 'xiaohui-router',
  })

  assert.equal(config.url, 'http://10.0.0.8:18789')
  assert.equal(config.token, 'token-123')
  assert.equal(config.model, 'xiaohui-router')
})

test('buildXiaohuiOpenClawHeaders 仅在存在 token 时写入 Authorization', () => {
  assert.deepEqual(buildXiaohuiOpenClawHeaders(''), {
    'Content-Type': 'application/json',
  })

  assert.deepEqual(buildXiaohuiOpenClawHeaders('abc'), {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer abc',
  })
})
