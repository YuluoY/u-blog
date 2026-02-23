#!/usr/bin/env node
/**
 * 文章编辑入口 & 博客分享模式 — 逻辑单元测试
 *
 * 核心概念：
 *   - 分享链接访问者是游客（无 token），角色等同于未登录用户
 *   - 只读模式（默认）：游客仅能浏览文章，不能写作/聊天
 *   - 完整模式：游客额外可以使用 AI 聊天（/chat）
 *   - 写作（/write）始终需要登录，不受分享模式影响
 *
 * 运行: node apps/frontend/tests/edit-and-share-mode.test.mjs
 */

let passed = 0
let failed = 0

function assert(condition, message) {
  if (condition) {
    passed++
    console.log(`  ✅ ${message}`)
  } else {
    failed++
    console.error(`  ❌ ${message}`)
  }
}

// ============================================================
// canEdit —— 已登录 + 文章作者即可编辑（与分享模式无关）
// ============================================================
console.log('\n=== canEdit 逻辑 ===')

function canEdit({ isLoggedIn, userId, articleUserId }) {
  if (!isLoggedIn) return false
  return userId === articleUserId
}

assert(canEdit({ isLoggedIn: true, userId: 1, articleUserId: 1 }) === true,
  '已登录 + 作者本人 → 可编辑')
assert(canEdit({ isLoggedIn: false, userId: 1, articleUserId: 1 }) === false,
  '未登录（游客） → 不可编辑')
assert(canEdit({ isLoggedIn: true, userId: 1, articleUserId: 2 }) === false,
  '已登录但非作者 → 不可编辑')
assert(canEdit({ isLoggedIn: true, userId: 1, articleUserId: undefined }) === false,
  'articleUserId 为 undefined → 不可编辑')

// ============================================================
// isReadOnly 逻辑
// ============================================================
console.log('\n=== isReadOnly 逻辑 ===')

function isReadOnly({ isSubdomainMode, settings }) {
  if (!isSubdomainMode) return false
  return !(settings && settings.blog_share_mode === 'full')
}

assert(isReadOnly({ isSubdomainMode: false, settings: {} }) === false,
  '非子域名模式 → 非只读')
assert(isReadOnly({ isSubdomainMode: true, settings: {} }) === true,
  '子域名 + 无设置 → 只读（默认）')
assert(isReadOnly({ isSubdomainMode: true, settings: null }) === true,
  '子域名 + settings 为 null → 只读')
assert(isReadOnly({ isSubdomainMode: true, settings: { blog_share_mode: 'readonly' } }) === true,
  '子域名 + 显式 readonly → 只读')
assert(isReadOnly({ isSubdomainMode: true, settings: { blog_share_mode: 'full' } }) === false,
  '子域名 + 显式 full → 非只读')

// ============================================================
// 路由守卫逻辑：requiresAuth + 完整模式 chat 豁免
// ============================================================
console.log('\n=== 路由守卫逻辑 ===')

function routeGuardResult({ routeName, requiresAuth, isLoggedIn, isSubdomainMode, isReadOnly }) {
  if (!requiresAuth) return 'allow'
  if (isLoggedIn) return 'allow'
  const isFullModeChat = isSubdomainMode && !isReadOnly && routeName === 'chat'
  return isFullModeChat ? 'allow' : 'redirect-login'
}

assert(routeGuardResult({ routeName: 'write', requiresAuth: true, isLoggedIn: true, isSubdomainMode: false, isReadOnly: false }) === 'allow',
  '已登录访问 /write → 放行')
assert(routeGuardResult({ routeName: 'write', requiresAuth: true, isLoggedIn: false, isSubdomainMode: false, isReadOnly: false }) === 'redirect-login',
  '游客访问 /write（非子域名） → 跳登录')
assert(routeGuardResult({ routeName: 'write', requiresAuth: true, isLoggedIn: false, isSubdomainMode: true, isReadOnly: false }) === 'redirect-login',
  '游客访问 /write（完整模式） → 仍跳登录（write 始终需要登录）')
assert(routeGuardResult({ routeName: 'write', requiresAuth: true, isLoggedIn: false, isSubdomainMode: true, isReadOnly: true }) === 'redirect-login',
  '游客访问 /write（只读模式） → 跳登录')
assert(routeGuardResult({ routeName: 'chat', requiresAuth: true, isLoggedIn: false, isSubdomainMode: true, isReadOnly: false }) === 'allow',
  '游客访问 /chat（完整模式） → 放行 ✨ 核心场景')
assert(routeGuardResult({ routeName: 'chat', requiresAuth: true, isLoggedIn: false, isSubdomainMode: true, isReadOnly: true }) === 'redirect-login',
  '游客访问 /chat（只读模式） → 跳登录')
assert(routeGuardResult({ routeName: 'chat', requiresAuth: true, isLoggedIn: false, isSubdomainMode: false, isReadOnly: false }) === 'redirect-login',
  '游客访问 /chat（非子域名） → 跳登录')
assert(routeGuardResult({ routeName: 'chat', requiresAuth: true, isLoggedIn: true, isSubdomainMode: true, isReadOnly: true }) === 'allow',
  '已登录访问 /chat（只读模式） → 放行（已认证用户不受限制）')
assert(routeGuardResult({ routeName: 'home', requiresAuth: false, isLoggedIn: false, isSubdomainMode: true, isReadOnly: true }) === 'allow',
  '游客访问 /home → 放行（无需认证）')

// ============================================================
// 导航过滤逻辑
// ============================================================
console.log('\n=== 导航过滤逻辑 ===')

function filterRoutes({ routes, isLoggedIn, isSubdomainMode, isReadOnly }) {
  return routes.filter((v) => {
    if (!v.name || !v.isAffix) return false
    if (v.requiresAuth && !isLoggedIn) {
      if (isSubdomainMode && !isReadOnly && v.name === 'chat') {
        return true
      }
      return false
    }
    return true
  })
}

const mockRoutes = [
  { name: 'home', isAffix: true, requiresAuth: false },
  { name: 'archive', isAffix: true, requiresAuth: false },
  { name: 'chat', isAffix: true, requiresAuth: true },
  { name: 'write', isAffix: true, requiresAuth: true },
  { name: 'about', isAffix: true, requiresAuth: false },
]

const f1 = filterRoutes({ routes: mockRoutes, isLoggedIn: false, isSubdomainMode: true, isReadOnly: true })
assert(f1.length === 3, '游客 + 只读模式：可见 home/archive/about（3个）')
assert(!f1.find(r => r.name === 'chat'), '游客 + 只读模式：chat 隐藏')
assert(!f1.find(r => r.name === 'write'), '游客 + 只读模式：write 隐藏')

const f2 = filterRoutes({ routes: mockRoutes, isLoggedIn: false, isSubdomainMode: true, isReadOnly: false })
assert(f2.length === 4, '游客 + 完整模式：可见 home/archive/chat/about（4个）')
assert(!!f2.find(r => r.name === 'chat'), '游客 + 完整模式：chat 可见 ✨')
assert(!f2.find(r => r.name === 'write'), '游客 + 完整模式：write 仍隐藏')

const f3 = filterRoutes({ routes: mockRoutes, isLoggedIn: true, isSubdomainMode: true, isReadOnly: true })
assert(f3.length === 5, '已登录 + 只读模式：全部可见（5个，登录用户不受分享模式限制）')

const f4 = filterRoutes({ routes: mockRoutes, isLoggedIn: true, isSubdomainMode: false, isReadOnly: false })
assert(f4.length === 5, '已登录 + 非子域名：全部可见（5个）')

const f5 = filterRoutes({ routes: mockRoutes, isLoggedIn: false, isSubdomainMode: false, isReadOnly: false })
assert(f5.length === 3, '游客 + 非子域名：隐藏 requiresAuth 路由（3个）')

// ============================================================
// 编辑模式检测
// ============================================================
console.log('\n=== 编辑模式检测 ===')

function detectEditMode(queryEdit) {
  const id = queryEdit ? parseInt(queryEdit, 10) : null
  return !!id && !Number.isNaN(id)
}

assert(detectEditMode('123') === true, '?edit=123 → 编辑模式')
assert(detectEditMode(null) === false, '无 edit 参数 → 非编辑模式')
assert(detectEditMode(undefined) === false, 'undefined → 非编辑模式')
assert(detectEditMode('abc') === false, '?edit=abc → 非编辑模式')
assert(detectEditMode('0') === false, '?edit=0 → 非编辑模式（0为falsy）')

// ============================================================
// 后端 chatAuthGuard 逻辑验证
// ============================================================
console.log('\n=== chatAuthGuard（后端 /chat 鉴权） ===')

function chatAuthGuard({ hasUser, blogOwnerId, shareModeSetting }) {
  if (hasUser) return { status: 200, pass: true }
  if (!blogOwnerId || typeof blogOwnerId !== 'number' || !isFinite(blogOwnerId)) {
    return { status: 401, pass: false }
  }
  if (shareModeSetting !== 'full') {
    return { status: 403, pass: false }
  }
  return { status: 200, pass: true }
}

assert(chatAuthGuard({ hasUser: true, blogOwnerId: null, shareModeSetting: null }).pass === true,
  '已登录用户 → 直接放行')
assert(chatAuthGuard({ hasUser: false, blogOwnerId: null, shareModeSetting: null }).status === 401,
  '游客无 blogOwnerId → 401')
assert(chatAuthGuard({ hasUser: false, blogOwnerId: 1, shareModeSetting: 'readonly' }).status === 403,
  '游客 + 博主只读模式 → 403')
assert(chatAuthGuard({ hasUser: false, blogOwnerId: 1, shareModeSetting: null }).status === 403,
  '游客 + 博主未设置分享模式 → 403（默认拒绝）')
assert(chatAuthGuard({ hasUser: false, blogOwnerId: 1, shareModeSetting: 'full' }).pass === true,
  '游客 + 博主完整模式 → 放行 ✨ 核心安全场景')
assert(chatAuthGuard({ hasUser: false, blogOwnerId: NaN, shareModeSetting: 'full' }).status === 401,
  '游客 + 无效 blogOwnerId(NaN) → 401')
assert(chatAuthGuard({ hasUser: false, blogOwnerId: 0, shareModeSetting: 'full' }).status === 401,
  '游客 + blogOwnerId=0 → 401（无效ID）')

// ============================================================
// 前端 preSendValidation 游客跳过逻辑
// ============================================================
console.log('\n=== preSendValidation 游客场景 ===')

function shouldSkipPreValidation({ isSubdomainMode, isReadOnly, isLoggedIn }) {
  return isSubdomainMode && !isReadOnly && !isLoggedIn
}

assert(shouldSkipPreValidation({ isSubdomainMode: true, isReadOnly: false, isLoggedIn: false }) === true,
  '子域名 + 完整模式 + 未登录 → 跳过前端验证（后端验证）')
assert(shouldSkipPreValidation({ isSubdomainMode: true, isReadOnly: true, isLoggedIn: false }) === false,
  '子域名 + 只读模式 + 未登录 → 不跳过（正常验证）')
assert(shouldSkipPreValidation({ isSubdomainMode: false, isReadOnly: false, isLoggedIn: false }) === false,
  '非子域名 + 未登录 → 不跳过')
assert(shouldSkipPreValidation({ isSubdomainMode: true, isReadOnly: false, isLoggedIn: true }) === false,
  '子域名 + 完整模式 + 已登录 → 不跳过（用自己的配置）')

// ============================================================
// 安全测试：localStorage 篡改不应影响 isReadOnly（服务端存储）
// ============================================================
console.log('\n=== 安全：localStorage 篡改防护 ===')

assert(isReadOnly({ isSubdomainMode: true, settings: { blog_share_mode: 'readonly' } }) === true,
  '服务端 readonly → 无论 localStorage 如何，始终只读')
assert(isReadOnly({ isSubdomainMode: true, settings: {} }) === true,
  '服务端无该字段 → 默认只读（安全默认值）')
assert(isReadOnly({ isSubdomainMode: true, settings: { blog_share_mode: 'full' } }) === false,
  '服务端 full → 允许完整模式（仅博主可在设置面板切换）')

// ============================================================
console.log(`\n${passed}/${passed + failed} tests passed`)
if (failed > 0) {
  process.exit(1)
}
