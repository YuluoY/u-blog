#!/usr/bin/env node

/**
 * u-blog 部署向导 — 服务端
 *
 * 提供静态文件服务（setup-ui/）+ REST API，引导用户完成环境检测、参数配置、
 * 依赖安装、服务部署与状态监控。零外部依赖，仅使用 Node.js 内置模块。
 *
 * 启动方式：
 *   bash setup.sh               （推荐，自动检测环境后启动）
 *   node scripts/setup.js       （本地预览，仅监听 127.0.0.1）
 *   node scripts/setup.js --host（服务器部署，监听 0.0.0.0）
 */

const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')
const { spawn, execSync } = require('node:child_process')
const crypto = require('node:crypto')

/* ------------------------------------------------------------------ */
/*  常量与运行参数                                                      */
/* ------------------------------------------------------------------ */

const PORT = 9090
const ARGS = process.argv.slice(2)
const HOST_MODE = ARGS.includes('--host')
const DOCKER_MODE = ARGS.includes('--docker-mode')
const LISTEN_HOST = HOST_MODE ? '0.0.0.0' : '127.0.0.1'

const ROOT = DOCKER_MODE ? '/app' : path.resolve(__dirname, '..')
const HOST_PROJECT_DIR = DOCKER_MODE ? (process.env.HOST_PROJECT_DIR || ROOT) : ROOT
const ENV_PATH = path.join(ROOT, '.env')
const ENV_EXAMPLE_PATH = path.join(ROOT, '.env.example')
const UI_DIR = path.join(__dirname, 'setup-ui')

/** 安全访问令牌 */
const TOKEN = crypto.randomBytes(16).toString('hex')

/** 部署状态 */
let deployState = { status: 'idle' }

/* ------------------------------------------------------------------ */
/*  静态文件服务                                                        */
/* ------------------------------------------------------------------ */

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
}

/**
 * 提供静态文件，对 HTML 注入安全令牌。
 * 包含路径穿越防护：规范化后检查是否仍在 UI_DIR 内。
 */
function serveFile(res, urlPath, injectToken) {
  const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '')
  const filePath = path.join(UI_DIR, safePath)
  if (!filePath.startsWith(UI_DIR)) {
    res.writeHead(403)
    res.end('Forbidden')
    return
  }
  try {
    let content = fs.readFileSync(filePath)
    const ext = path.extname(filePath)
    if (injectToken && ext === '.html') {
      content = content.toString('utf-8').replaceAll('__SETUP_TOKEN__', TOKEN)
    }
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-cache, must-revalidate',
    })
    res.end(content)
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not Found')
  }
}

/* ------------------------------------------------------------------ */
/*  鉴权                                                              */
/* ------------------------------------------------------------------ */

function checkAuth(req) {
  const url = new URL(req.url, 'http://localhost')
  const t = url.searchParams.get('token')
    || (req.headers.authorization || '').replace('Bearer ', '')
  return t === TOKEN
}

/* ------------------------------------------------------------------ */
/*  .env 读写                                                          */
/* ------------------------------------------------------------------ */

function readEnv() {
  const fp = fs.existsSync(ENV_PATH)
    ? ENV_PATH
    : fs.existsSync(ENV_EXAMPLE_PATH) ? ENV_EXAMPLE_PATH : null
  if (!fp) return {}
  const result = {}
  for (const line of fs.readFileSync(fp, 'utf-8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const idx = t.indexOf('=')
    if (idx === -1) continue
    result[t.slice(0, idx).trim()] = t.slice(idx + 1).trim()
  }
  return result
}

function saveEnv(data) {
  const VALID = /^[A-Z][A-Z0-9_]*$/
  for (const k of Object.keys(data)) {
    if (!VALID.test(k)) throw new Error(`非法配置键: ${k}`)
  }
  const ts = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })
  const lines = [
    '# u-blog 环境变量（由部署向导自动生成）',
    `# 时间：${ts}`,
    '',
    `DOMAIN=${data.DOMAIN || 'localhost'}`,
    `ENABLE_SSL=${data.ENABLE_SSL || 'false'}`,
    `SSL_DIR=${data.SSL_DIR || './deploy/nginx/ssl'}`,
    `SSL_CERT=${data.SSL_CERT || '/etc/nginx/ssl/cert.crt'}`,
    `SSL_KEY=${data.SSL_KEY || '/etc/nginx/ssl/cert.key'}`,
    '',
    `DB_USERNAME=${data.DB_USERNAME || 'ublog'}`,
    `DB_PASSWORD=${data.DB_PASSWORD || ''}`,
    `DB_DATABASE=${data.DB_DATABASE || 'ublog'}`,
    '',
    `JWT_SECRET=${data.JWT_SECRET || ''}`,
    `ENCRYPTION_KEY=${data.ENCRYPTION_KEY || ''}`,
    `TRANSPORT_KEY=${data.TRANSPORT_KEY || ''}`,
    `CAPTCHA_SECRET=${data.CAPTCHA_SECRET || ''}`,
    '',
    'NODE_ENV=production',
    `SITE_URL=${data.SITE_URL || ''}`,
    `CORS_ORIGIN=${data.CORS_ORIGIN || ''}`,
    '',
    `INIT_SEED_DATA=${data.INIT_SEED_DATA || 'false'}`,
    '',
    `EMAIL_USER=${data.EMAIL_USER || ''}`,
    `EMAIL_PASS=${data.EMAIL_PASS || ''}`,
    '',
    'REDIS_HOST=redis',
    'REDIS_PORT=6379',
    `REDIS_PASSWORD=${data.REDIS_PASSWORD || ''}`,
    '',
    `OPENCLAW_URL=${data.OPENCLAW_URL || ''}`,
    `OPENCLAW_TOKEN=${data.OPENCLAW_TOKEN || ''}`,
    `OPENCLAW_MODEL=${data.OPENCLAW_MODEL || 'default'}`,
    '',
    `SO360_PUSH_ENABLED=${data.SO360_PUSH_ENABLED || 'false'}`,
    '',
  ]
  fs.writeFileSync(ENV_PATH, lines.join('\n'), 'utf-8')
}

/* ------------------------------------------------------------------ */
/*  环境检测                                                           */
/* ------------------------------------------------------------------ */

function checkEnvironment() {
  const results = []

  // Docker
  try {
    const v = execSync('docker version --format "{{.Server.Version}}"', { timeout: 10000 }).toString().trim()
    results.push({ id: 'docker', name: 'Docker Engine', ok: true, detail: `v${v}` })
  } catch {
    let detail = '未安装'
    let fixable = 'install-docker'
    try {
      execSync('which docker 2>/dev/null || command -v docker', { timeout: 5000 })
      detail = '已安装但未运行'
      fixable = 'start-docker'
    } catch { /* 确实未安装 */ }
    results.push({ id: 'docker', name: 'Docker Engine', ok: false, detail, fixable })
  }

  // Docker Compose
  try {
    const v = execSync('docker compose version --short', { timeout: 10000 }).toString().trim()
    results.push({ id: 'compose', name: 'Docker Compose', ok: true, detail: `v${v}` })
  } catch {
    results.push({ id: 'compose', name: 'Docker Compose', ok: false, detail: '未安装', fixable: 'install-compose' })
  }

  // 磁盘空间
  try {
    const df = execSync(`df -BG "${ROOT}" 2>/dev/null || df -g "${ROOT}" | tail -1`, { timeout: 5000 }).toString().trim()
    const lines = df.split('\n')
    const parts = lines[lines.length - 1].split(/\s+/)
    results.push({ id: 'disk', name: '磁盘空间', ok: true, detail: `可用 ${parts[3] || '未知'}（已用 ${parts[4] || '未知'}）` })
  } catch {
    results.push({ id: 'disk', name: '磁盘空间', ok: true, detail: '无法检测' })
  }

  // .env
  const envExists = fs.existsSync(ENV_PATH)
  results.push({
    id: 'env',
    name: '配置文件 .env',
    ok: true,
    detail: envExists ? '已存在（将读取现有配置）' : '未创建（将自动生成）',
  })

  return results
}

/* ------------------------------------------------------------------ */
/*  ANSI 清理                                                          */
/* ------------------------------------------------------------------ */

function stripAnsi(s) {
  return s.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').replace(/\x1b\][^\x07]*\x07/g, '')
}

/* ------------------------------------------------------------------ */
/*  Docker Compose 封装                                                */
/* ------------------------------------------------------------------ */

function composeArgs(args) {
  if (DOCKER_MODE) {
    return [
      'compose', '-f', path.join(ROOT, 'docker-compose.yml'),
      '--project-directory', HOST_PROJECT_DIR,
      '--env-file', ENV_PATH,
      ...args,
    ]
  }
  return ['compose', ...args]
}

function getContainerStatus() {
  try {
    const composeDir = DOCKER_MODE ? `-f ${ROOT}/docker-compose.yml --project-directory ${HOST_PROJECT_DIR}` : ''
    const raw = execSync(
      `docker compose ${composeDir} ps --format json`,
      { cwd: DOCKER_MODE ? undefined : ROOT, timeout: 15000, encoding: 'utf-8' },
    )
    return raw.trim().split('\n').filter(Boolean).map(l => {
      try { return JSON.parse(l) } catch { return null }
    }).filter(Boolean).map(c => ({
      name: c.Name || c.Service || '',
      service: c.Service || '',
      state: c.State || '',
      status: c.Status || '',
      health: c.Health || '',
    }))
  } catch {
    return []
  }
}

function getContainerLogs(name, lines) {
  try {
    return execSync(`docker logs ${name} --tail ${lines || 50} 2>&1`, {
      timeout: 10000,
      encoding: 'utf-8',
    })
  } catch (e) {
    return e.stdout || e.message || '无法获取日志'
  }
}

/* ------------------------------------------------------------------ */
/*  流式命令执行（部署 / 安装）                                          */
/* ------------------------------------------------------------------ */

/**
 * 以 NDJSON 流式响应执行 shell 命令。
 * 每行输出一个 JSON 对象：{ type: 'stdout'|'stderr'|'exit'|'error', text?, code? }
 */
function streamCommand(res, cmd, args, opts = {}) {
  const child = spawn(cmd, args, {
    cwd: opts.cwd,
    env: { ...process.env, ...opts.env },
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  const send = (type, text) => {
    const cleaned = stripAnsi(text).trim()
    if (!cleaned) return
    try { res.write(JSON.stringify({ type, text: cleaned }) + '\n') } catch { /* 连接已关闭 */ }
  }

  child.stdout.on('data', d => send('stdout', d.toString()))
  child.stderr.on('data', d => send('stderr', d.toString()))
  child.on('close', code => {
    try {
      res.write(JSON.stringify({ type: 'exit', code }) + '\n')
      res.end()
    } catch { /* 连接已关闭 */ }
  })
  child.on('error', err => {
    try {
      res.write(JSON.stringify({ type: 'error', text: err.message }) + '\n')
      res.end()
    } catch { /* 连接已关闭 */ }
  })

  return child
}

function startDeploy(res) {
  if (deployState.status === 'running') {
    res.write(JSON.stringify({ type: 'error', text: '部署正在进行中，请勿重复操作' }) + '\n')
    res.end()
    return
  }
  deployState.status = 'running'

  const child = streamCommand(res, 'docker', composeArgs(['up', '-d', '--build']), {
    cwd: DOCKER_MODE ? undefined : ROOT,
    env: { COMPOSE_ANSI: 'never', DOCKER_CLI_HINTS: 'false', BUILDKIT_PROGRESS: 'plain' },
  })

  child.on('close', code => { deployState.status = code === 0 ? 'success' : 'failed' })
  child.on('error', () => { deployState.status = 'failed' })
}

/** 安装指定组件（Docker / Compose / 启动 Docker） */
function startInstall(res, target) {
  const scripts = {
    'install-docker': {
      cmd: 'sh',
      args: ['-c', 'curl -fsSL https://get.docker.com | sh && systemctl start docker && systemctl enable docker'],
    },
    'start-docker': {
      cmd: 'sh',
      args: ['-c', 'systemctl start docker 2>/dev/null || service docker start'],
    },
    'install-compose': {
      cmd: 'sh',
      args: ['-c', [
        'COMPOSE_URL="https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)"',
        'mkdir -p /usr/local/lib/docker/cli-plugins',
        'curl -SL "$COMPOSE_URL" -o /usr/local/lib/docker/cli-plugins/docker-compose',
        'chmod +x /usr/local/lib/docker/cli-plugins/docker-compose',
        'docker compose version',
      ].join(' && ')],
    },
  }
  const spec = scripts[target]
  if (!spec) {
    res.write(JSON.stringify({ type: 'error', text: `未知安装目标: ${target}` }) + '\n')
    res.end()
    return
  }
  streamCommand(res, spec.cmd, spec.args)
}

/* ------------------------------------------------------------------ */
/*  请求体解析                                                         */
/* ------------------------------------------------------------------ */

const MAX_BODY = 64 * 1024
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', chunk => {
      body += chunk
      if (body.length > MAX_BODY) {
        reject(new Error('请求体过大'))
        req.destroy()
      }
    })
    req.on('end', () => {
      try { resolve(JSON.parse(body)) } catch (e) { reject(e) }
    })
  })
}

/* ------------------------------------------------------------------ */
/*  HTTP 路由                                                          */
/* ------------------------------------------------------------------ */

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost')
  const p = url.pathname

  // ---- 主页面（需要 token） ----
  if (req.method === 'GET' && (p === '/' || p === '/index.html')) {
    if (!checkAuth(req)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end([
        '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8">',
        '<style>body{display:flex;justify-content:center;align-items:center;height:100vh;',
        'background:#09090b;color:#a1a1aa;font-family:system-ui,sans-serif;text-align:center}',
        'h2{color:#fafafa;margin-bottom:8px;font-size:18px}p{font-size:14px}</style></head>',
        '<body><div><h2>需要访问令牌</h2><p>请使用终端中输出的完整链接访问</p></div></body></html>',
      ].join(''))
      return
    }
    serveFile(res, '/index.html', true)
    return
  }

  // ---- API 路由（需要鉴权） ----
  if (p.startsWith('/api/')) {
    if (!checkAuth(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: '未授权' }))
      return
    }

    // 环境检测
    if (req.method === 'GET' && p === '/api/check') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(checkEnvironment()))
      return
    }

    // 读取配置
    if (req.method === 'GET' && p === '/api/env') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ exists: fs.existsSync(ENV_PATH), values: readEnv() }))
      return
    }

    // 保存配置
    if (req.method === 'POST' && p === '/api/env') {
      try {
        const data = await parseBody(req)
        saveEnv(data)
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true }))
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: e.message }))
      }
      return
    }

    // 安装组件（流式）
    if (req.method === 'POST' && p === '/api/install') {
      const target = url.searchParams.get('target')
      if (!target || !/^[a-z-]+$/.test(target)) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: '无效的安装目标' }))
        return
      }
      res.writeHead(200, {
        'Content-Type': 'application/x-ndjson',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      })
      startInstall(res, target)
      return
    }

    // 部署（流式）
    if (req.method === 'GET' && p === '/api/deploy') {
      res.writeHead(200, {
        'Content-Type': 'application/x-ndjson',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      })
      startDeploy(res)
      return
    }

    // 容器状态
    if (req.method === 'GET' && p === '/api/status') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(getContainerStatus()))
      return
    }

    // 容器日志
    if (req.method === 'GET' && p === '/api/logs') {
      const name = url.searchParams.get('name')
      const lines = parseInt(url.searchParams.get('lines') || '50', 10)
      if (!name || !/^[a-zA-Z0-9_-]+$/.test(name)) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: '无效的容器名' }))
        return
      }
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ logs: stripAnsi(getContainerLogs(name, lines)) }))
      return
    }

    // 关闭向导
    if (req.method === 'POST' && p === '/api/shutdown') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: true }))
      setTimeout(() => process.exit(0), 500)
      return
    }
  }

  // ---- 其他静态资源（无需鉴权） ----
  if (req.method === 'GET') {
    serveFile(res, p, false)
    return
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' })
  res.end('Not Found')
})

/* ------------------------------------------------------------------ */
/*  启动                                                              */
/* ------------------------------------------------------------------ */

function getLocalIP() {
  try {
    const nets = require('node:os').networkInterfaces()
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) return net.address
      }
    }
  } catch {}
  return null
}

server.listen(PORT, LISTEN_HOST, () => {
  const ip = getLocalIP()
  const localUrl = `http://localhost:${PORT}?token=${TOKEN}`
  const remoteUrl = ip ? `http://${ip}:${PORT}?token=${TOKEN}` : null

  console.log('')
  console.log('  \x1b[36m\x1b[1mu-blog\x1b[0m 部署向导已启动')
  console.log('  \x1b[2m' + '─'.repeat(36) + '\x1b[0m')
  if (HOST_MODE && remoteUrl) {
    console.log(`  \x1b[32m>\x1b[0m 远程: ${remoteUrl}`)
    console.log(`  \x1b[2m  本地: ${localUrl}\x1b[0m`)
  } else {
    console.log(`  \x1b[32m>\x1b[0m ${localUrl}`)
  }
  console.log('')
  console.log('  \x1b[33m!\x1b[0m 链接包含安全令牌，请勿泄露')
  console.log('')

  // 本地模式自动打开浏览器
  if (!HOST_MODE) {
    try {
      const cmd = process.platform === 'darwin' ? 'open'
        : process.platform === 'win32' ? 'start' : 'xdg-open'
      execSync(`${cmd} "${localUrl}"`, { stdio: 'ignore' })
    } catch { /* 静默忽略 */ }
  }
})
