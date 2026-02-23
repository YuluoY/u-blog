/**
 * 安全回归测试脚本 — 验证 RestWriteGuard 权限模型
 *
 * 前置条件：
 *   1. 后端运行于 http://localhost:3000
 *   2. 数据库中存在用户：huyongle(super_admin), admin(admin), testuser(user)
 *      密码均为 123456
 *
 * 运行: npx tsx scripts/security-regression.ts
 */

const BASE = 'http://localhost:3000'

interface TestCase {
  name: string
  fn: () => Promise<void>
}

const results: Array<{ name: string; pass: boolean; detail?: string }> = []

async function api(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<{ status: number; json: any }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const resp = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await resp.json()
  return { status: resp.status, json }
}

async function login(username: string): Promise<string> {
  const { json } = await api('POST', '/login', { username, password: '123456' })
  if (json.code !== 0) throw new Error(`Login failed for ${username}: ${json.message}`)
  return json.data.token
}

function assert(condition: boolean, msg: string): void {
  if (!condition) throw new Error(msg)
}

const tests: TestCase[] = []

function test(name: string, fn: () => Promise<void>) {
  tests.push({ name, fn })
}

/* ---------- 测试用例 ---------- */

let superToken = ''
let adminToken = ''
let userToken = ''

test('登录并获取 Token', async () => {
  superToken = await login('huyongle')
  adminToken = await login('admin')
  userToken = await login('testuser')
  assert(superToken.length > 50, 'super_admin token')
  assert(adminToken.length > 50, 'admin token')
  assert(userToken.length > 50, 'user token')
})

// ---------- P0-1 & P0-2: IDOR (Article) ----------

test('P0-1: user 不能更新他人文章', async () => {
  const { json } = await api('PUT', '/rest/article/update', { id: 1, title: 'HACKED' }, userToken)
  assert(json.code === 403, `Expected 403, got ${json.code}: ${json.message}`)
})

test('P0-2: user 不能删除他人文章', async () => {
  const { json } = await api('DELETE', '/rest/article/del', { id: 1 }, userToken)
  assert(json.code === 403, `Expected 403, got ${json.code}: ${json.message}`)
})

test('user 可以更新自己的文章', async () => {
  // testuser(id=5) 拥有 article id=2
  const { json } = await api('PUT', '/rest/article/update', { id: 2, title: '深入理解后端总结（2）' }, userToken)
  assert(json.code === 0, `Expected 0, got ${json.code}: ${json.message}`)
})

test('admin 可以更新任意文章', async () => {
  const { json } = await api('PUT', '/rest/article/update', { id: 2, title: '深入理解后端总结（2）' }, adminToken)
  assert(json.code === 0, `Expected 0, got ${json.code}: ${json.message}`)
})

// ---------- P0-3: 权限提升防护 ----------

test('P0-3: user 不能修改自身 role', async () => {
  const { json } = await api('PUT', '/rest/users/update', { id: 5, role: 'super_admin' }, userToken)
  assert(json.code === 0, `Update should succeed but strip role field`)
  assert(json.data?.role === 'user', `Role should remain 'user', got '${json.data?.role}'`)
})

test('admin 也不能修改 role', async () => {
  const { json } = await api('PUT', '/rest/users/update', { id: 2, role: 'super_admin' }, adminToken)
  assert(json.data?.role === 'admin', `Role should remain 'admin', got '${json.data?.role}'`)
})

test('super_admin 可以修改 role', async () => {
  // 先改后改回
  const { json: r1 } = await api('PUT', '/rest/users/update', { id: 5, role: 'admin' }, superToken)
  assert(r1.data?.role === 'admin', `Should be changed to 'admin'`)
  const { json: r2 } = await api('PUT', '/rest/users/update', { id: 5, role: 'user' }, superToken)
  assert(r2.data?.role === 'user', `Should be changed back to 'user'`)
})

// ---------- P0-4: 跨用户修改防护 ----------

test('P0-4: user 不能修改他人资料', async () => {
  const { json } = await api('PUT', '/rest/users/update', { id: 2, bio: 'HACKED' }, userToken)
  assert(json.code === 403, `Expected 403, got ${json.code}: ${json.message}`)
})

test('user 可以修改自己的资料', async () => {
  const { json } = await api('PUT', '/rest/users/update', { id: 5, bio: '普通用户，喜欢阅读和写作' }, userToken)
  assert(json.code === 0, `Expected 0, got ${json.code}: ${json.message}`)
})

// ---------- P0-5: 敏感字段泄露防护 ----------

test('P0-5: REST 查询 Users 不泄露敏感字段', async () => {
  const { json } = await api('POST', '/rest/users/query', { where: { id: 3 } }, adminToken)
  const data = Array.isArray(json.data) ? json.data[0] : json.data
  const sensitive = ['password', 'token', 'rthash', 'isActive', 'failLoginCount', 'lockoutExpiresAt', 'lastLoginAt']
  const leaked = sensitive.filter(f => f in data)
  assert(leaked.length === 0, `Leaked fields: ${leaked.join(', ')}`)
})

test('登录响应不泄露敏感字段', async () => {
  const { json } = await api('POST', '/login', { username: 'huyongle', password: '123456' })
  const fields = ['password', 'rthash', 'isActive', 'failLoginCount', 'lockoutExpiresAt', 'lastLoginAt']
  const leaked = fields.filter(f => f in json.data)
  assert(leaked.length === 0, `Login leaked: ${leaked.join(', ')}`)
  assert('token' in json.data, 'Token should be present in login response')
})

// ---------- P0-6: 全局设置写入防护 ----------

test('P0-6: user 不能写入全局 setting', async () => {
  const r1 = await api('PUT', '/rest/setting/update', { id: 1, value: 'hacked' }, userToken)
  assert(r1.json.code === 403, `update: Expected 403, got ${r1.json.code}`)
  const r2 = await api('POST', '/rest/setting/add', { key: 'hack', value: 'x' }, userToken)
  assert(r2.json.code === 403, `add: Expected 403, got ${r2.json.code}`)
  const r3 = await api('DELETE', '/rest/setting/del', { id: 1 }, userToken)
  assert(r3.json.code === 403, `del: Expected 403, got ${r3.json.code}`)
})

test('admin 可以写入全局 setting', async () => {
  const { json } = await api('POST', '/rest/setting/query', {}, adminToken)
  assert(json.code === 0, 'admin should be able to query settings')
})

// ---------- user_setting 数据隔离 ----------

test('user_setting: user 可添加自己的 API key', async () => {
  const { json } = await api('POST', '/rest/user_setting/add', {
    key: '_test_regression_key',
    value: JSON.stringify('test-value'),
    desc: 'regression test',
  }, userToken)
  assert(json.code === 0, `add: Expected 0, got ${json.code}: ${json.message}`)
})

test('user_setting: 查询隔离（只能看自己的）', async () => {
  const { json } = await api('POST', '/rest/user_setting/query', { where: { userId: 3 } }, userToken)
  const data = Array.isArray(json.data) ? json.data : []
  const foreign = data.filter((r: any) => r.userId !== 5)
  assert(foreign.length === 0, `Should not see other users data, got ${foreign.length} foreign records`)
})

test('user_setting: 不能修改他人设置', async () => {
  const { json: r1 } = await api('POST', '/rest/user_setting/query', { where: { userId: 3 } }, superToken)
  const superSettingId = Array.isArray(r1.data) && r1.data.length > 0 ? r1.data[0].id : null
  if (superSettingId) {
    const { json } = await api('PUT', '/rest/user_setting/update', { id: superSettingId, value: '"STOLEN"' }, userToken)
    assert(json.code === 403, `Expected 403, got ${json.code}: ${json.message}`)
  }
})

test('user_setting: 不能删除他人设置', async () => {
  const { json: r1 } = await api('POST', '/rest/user_setting/query', { where: { userId: 3 } }, superToken)
  const superSettingId = Array.isArray(r1.data) && r1.data.length > 0 ? r1.data[0].id : null
  if (superSettingId) {
    const { json } = await api('DELETE', '/rest/user_setting/del', { id: superSettingId }, userToken)
    assert(json.code === 403, `Expected 403, got ${json.code}: ${json.message}`)
  }
})

test('user_setting: admin 也不能修改 super_admin 的设置', async () => {
  const { json: r1 } = await api('POST', '/rest/user_setting/query', {}, superToken)
  const superSettingId = Array.isArray(r1.data) && r1.data.length > 0 ? r1.data[0].id : null
  if (superSettingId) {
    const { json } = await api('PUT', '/rest/user_setting/update', { id: superSettingId, value: '"STOLEN"' }, adminToken)
    assert(json.code === 403, `Expected 403, got ${json.code}: ${json.message}`)
  }
})

// ---------- 清理测试数据 ----------

test('清理回归测试数据', async () => {
  const { json } = await api('POST', '/rest/user_setting/query', { where: { key: '_test_regression_key' } }, userToken)
  if (Array.isArray(json.data)) {
    for (const item of json.data) {
      await api('DELETE', '/rest/user_setting/del', { id: item.id }, userToken)
    }
  }
})

// ---------- ip-location 后端代理 ----------

test('ip-location 端点不返回 500', async () => {
  const { status, json } = await api('GET', '/ip-location')
  assert(status === 200, `Expected 200, got ${status}`)
  assert(typeof json === 'object', 'Should return JSON object')
})

// ---------- Category/Tag IDOR ----------

test('user 不能删除他人的 category', async () => {
  // 先查一条不属于 testuser 的 category
  const { json: cats } = await api('POST', '/rest/category/query', {}, userToken)
  const data = Array.isArray(cats.data) ? cats.data : []
  const foreign = data.find((c: any) => c.userId && c.userId !== 5)
  if (foreign) {
    const { json } = await api('DELETE', '/rest/category/del', { id: foreign.id }, userToken)
    assert(json.code === 403, `Expected 403, got ${json.code}`)
  }
})

test('user 不能更新他人的 tag', async () => {
  const { json: tags } = await api('POST', '/rest/tag/query', {}, userToken)
  const data = Array.isArray(tags.data) ? tags.data : []
  const foreign = data.find((t: any) => t.userId && t.userId !== 5)
  if (foreign) {
    const { json } = await api('PUT', '/rest/tag/update', { id: foreign.id, name: 'HACKED' }, userToken)
    assert(json.code === 403, `Expected 403, got ${json.code}`)
  }
})

// ---------- 未认证访问防护 ----------

test('未认证用户不能写入', async () => {
  const r1 = await api('PUT', '/rest/article/update', { id: 1, title: 'x' })
  assert(r1.json.code === 401, `article update without auth: expected 401, got ${r1.json.code}`)
  const r2 = await api('DELETE', '/rest/article/del', { id: 1 })
  assert(r2.json.code === 401, `article del without auth: expected 401, got ${r2.json.code}`)
})

test('用户删除仅 super_admin 可执行', async () => {
  const r1 = await api('DELETE', '/rest/users/del', { id: 5 }, userToken)
  assert(r1.json.code === 403, `user del by user: expected 403, got ${r1.json.code}`)
  const r2 = await api('DELETE', '/rest/users/del', { id: 5 }, adminToken)
  assert(r2.json.code === 403, `user del by admin: expected 403, got ${r2.json.code}`)
})

/* ---------- 执行 ---------- */

async function run() {
  console.log(`\n🔒 安全回归测试 (${tests.length} 用例)\n${'─'.repeat(50)}`)

  let pass = 0
  let fail = 0

  for (const t of tests) {
    try {
      await t.fn()
      pass++
      results.push({ name: t.name, pass: true })
      console.log(`  ✅ ${t.name}`)
    } catch (e: any) {
      fail++
      results.push({ name: t.name, pass: false, detail: e.message })
      console.log(`  ❌ ${t.name}`)
      console.log(`     ${e.message}`)
    }
  }

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`  Total: ${tests.length}  Pass: ${pass}  Fail: ${fail}`)
  console.log(`${'─'.repeat(50)}\n`)

  process.exit(fail > 0 ? 1 : 0)
}

run().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
