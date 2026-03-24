/**
 * u-blog 部署向导 — 客户端逻辑 v2
 *
 * CDN 依赖：Lucide Icons · GSAP · canvas-confetti · NProgress
 * 与 setup.js 服务端配合，驱动 4 步部署流程。
 */

/* ================================================================== */
/*  State                                                              */
/* ================================================================== */

const TOKEN = document.querySelector('meta[name="api-token"]').content
let currentStep = 1
let envLoaded = false
let deployStartTime = null
let deployTimerInterval = null

/* ================================================================== */
/*  API Helper                                                         */
/* ================================================================== */

/** 带鉴权 + NProgress 的 fetch 封装 */
function api(url, opts = {}) {
  opts.headers = { ...opts.headers, 'Authorization': 'Bearer ' + TOKEN }
  return fetch(url, opts)
}

/* ================================================================== */
/*  Init                                                               */
/* ================================================================== */

function init() {
  NProgress.configure({ showSpinner: false, speed: 400, minimum: 0.08 })
  renderIcons()
  setupListeners()
  // 延迟初始化 tab indicator（等待首帧渲染）
  requestAnimationFrame(() => initTabIndicators())
  runCheck()
}

function renderIcons() {
  if (window.lucide) lucide.createIcons()
}

function setupListeners() {
  const ssl = $('ENABLE_SSL')
  if (ssl) ssl.addEventListener('change', () => { toggleSsl(); deriveSiteUrl() })
  const domain = $('DOMAIN')
  if (domain) domain.addEventListener('input', deriveSiteUrl)
}

/* ================================================================== */
/*  Utils                                                              */
/* ================================================================== */

function $(id) { return document.getElementById(id) }

function escHtml(s) {
  const d = document.createElement('div')
  d.textContent = s || ''
  return d.innerHTML
}

function showToast(msg, type) {
  const el = $('toast')
  const icon = $('toastIcon')
  $('toastMsg').textContent = msg
  if (icon) {
    icon.setAttribute('data-lucide', type === 'error' ? 'alert-circle' : 'check-circle')
    renderIcons()
  }
  el.className = 'toast t-' + type + ' show'
  clearTimeout(el._timer)
  el._timer = setTimeout(() => el.classList.remove('show'), 3500)
}

/** 浏览器端安全随机值生成 */
function genRandom(bytes, encoding) {
  const arr = new Uint8Array(bytes)
  crypto.getRandomValues(arr)
  if (encoding === 'hex') return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('')
  if (encoding === 'base64url') {
    const b64 = btoa(String.fromCharCode.apply(null, arr))
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }
  return btoa(String.fromCharCode.apply(null, arr))
}

/* ================================================================== */
/*  Tab System — GSAP 驱动的滑动指示器                                   */
/* ================================================================== */

/**
 * 初始化所有 tab-bar 的指示器位置。
 * 需在对应面板可见时调用（display:none 时无法计算尺寸）。
 */
function initTabIndicators() {
  moveIndicator('configTabs', 'configTabInk')
  moveIndicator('statusTabs', 'statusTabInk')
}

/** 将指示器瞬移到当前激活 tab 的位置 */
function moveIndicator(tabBarId, inkId) {
  const bar = $(tabBarId)
  const ink = $(inkId)
  if (!bar || !ink) return
  const active = bar.querySelector('.tab-btn.active')
  if (!active) return
  gsap.set(ink, {
    x: active.offsetLeft,
    width: active.offsetWidth,
  })
}

/** 切换 Panel 2 配置 tab */
function switchConfigTab(btn, tabId) {
  switchTab('configTabs', 'configTabInk', btn, tabId)
}

/** 切换 Panel 4 状态 tab */
function switchStatusTab(btn, tabId) {
  switchTab('statusTabs', 'statusTabInk', btn, tabId)
}

/**
 * 通用 tab 切换：
 * 1. 更新 button 激活态
 * 2. GSAP 动画滑动 ink 指示器
 * 3. 切换 tab-pane 并做淡入动画
 */
function switchTab(tabBarId, inkId, btn, tabId) {
  const bar = $(tabBarId)
  const ink = $(inkId)

  // 更新按钮状态
  bar.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
  btn.classList.add('active')

  // 滑动指示器
  gsap.to(ink, {
    x: btn.offsetLeft,
    width: btn.offsetWidth,
    duration: 0.35,
    ease: 'power2.out',
  })

  // 切换面板内容
  const parent = bar.parentElement
  parent.querySelectorAll('.tab-pane').forEach(p => {
    if (p.id === tabId) {
      p.classList.add('active')
      gsap.fromTo(p, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' })
    } else {
      p.classList.remove('active')
    }
  })

  renderIcons()
}

/* ================================================================== */
/*  Step Nav                                                           */
/* ================================================================== */

function goStep(n) {
  if (n < 1 || n > 4) return
  currentStep = n

  // 面板切换 + GSAP 动画
  document.querySelectorAll('.panel').forEach((el, i) => {
    const isActive = i + 1 === n
    el.classList.toggle('active', isActive)
    if (isActive) {
      gsap.fromTo(el, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' })
    }
  })

  // 步骤指示器
  document.querySelectorAll('.step-item').forEach(el => {
    const s = +el.dataset.step
    el.classList.remove('active', 'done')
    if (s === n) el.classList.add('active')
    else if (s < n) el.classList.add('done')
  })
  document.querySelectorAll('.step-line').forEach(el => {
    const l = +el.dataset.line
    el.classList.toggle('done', l < n)
  })

  renderIcons()
  window.scrollTo({ top: 0, behavior: 'smooth' })

  // 按需加载数据
  if (n === 2 && !envLoaded) loadEnvValues()
  // tab indicator 需在面板可见后重算
  if (n === 2 || n === 4) requestAnimationFrame(() => initTabIndicators())
  if (n === 4) refreshStatus()
}

/* ================================================================== */
/*  Step 1 — 环境检测                                                   */
/* ================================================================== */

async function runCheck() {
  const el = $('checkList')
  el.innerHTML = buildCheckItem(null, '正在检测...', '', 'loading')
  renderIcons()
  $('btnNext1').disabled = true
  NProgress.start()

  try {
    const res = await api('/api/check')
    const data = await res.json()
    let allOk = true
    el.innerHTML = data.map(item => {
      if (!item.ok) allOk = false
      return buildCheckItem(
        item.ok ? 'pass' : 'fail',
        item.name,
        item.detail,
        item.ok ? 'ok' : 'fail',
        item.fixable
      )
    }).join('')
    renderIcons()
    $('btnNext1').disabled = !allOk
    // GSAP 交错入场动画
    gsap.from('#checkList .check-item', {
      opacity: 0, x: -16, duration: 0.35,
      stagger: 0.08, ease: 'power2.out',
    })
  } catch (e) {
    el.innerHTML = buildCheckItem('fail', '检测失败', e.message, 'fail')
    renderIcons()
  }
  NProgress.done()
}

function buildCheckItem(cls, name, detail, status, fixable) {
  let iconAttr = 'loader'
  let iconClass = 'spin'
  if (status === 'ok')   { iconAttr = 'check-circle'; iconClass = '' }
  if (status === 'fail') { iconAttr = 'x-circle';     iconClass = '' }

  let actionHtml = ''
  if (fixable) {
    const labels = {
      'install-docker': '安装 Docker',
      'start-docker': '启动 Docker',
      'install-compose': '安装 Compose',
    }
    actionHtml = '<div class="check-action"><button class="btn btn-ghost btn-sm" onclick="runInstall(\'' + fixable + '\')">' +
      '<i data-lucide="download"></i> ' + (labels[fixable] || '修复') + '</button></div>'
  }

  return '<div class="check-item ' + (cls || '') + '">' +
    '<div class="check-icon"><i data-lucide="' + iconAttr + '" class="' + iconClass + '"></i></div>' +
    '<div class="check-body"><span class="check-name">' + escHtml(name) + '</span>' +
    '<span class="check-detail">' + escHtml(detail) + '</span></div>' +
    actionHtml + '</div>'
}

/* ================================================================== */
/*  Step 1 — 组件安装                                                   */
/* ================================================================== */

async function runInstall(target) {
  const card = $('installTerminalCard')
  const body = $('installTermBody')
  const labels = { 'install-docker': 'Docker', 'start-docker': 'Docker', 'install-compose': 'Docker Compose' }
  $('installTermTitle').textContent = '安装 ' + (labels[target] || target)
  $('installTermLabel').textContent = target

  card.style.display = 'block'
  body.innerHTML = ''
  appendTerm(body, '$ ' + target, 'tc-cmd')

  gsap.from(card, { opacity: 0, y: 10, duration: 0.3, ease: 'power2.out' })
  card.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

  try {
    const res = await fetch('/api/install?target=' + encodeURIComponent(target), {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + TOKEN },
    })
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buf = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop()
      for (const line of lines) {
        if (!line.trim()) continue
        try { handleStreamEvent(JSON.parse(line), body) } catch { /* 非 JSON 跳过 */ }
      }
    }
    if (buf.trim()) try { handleStreamEvent(JSON.parse(buf), body) } catch {}
  } catch (e) {
    appendTerm(body, 'Connection error: ' + e.message, 'tc-err')
  }

  showToast('安装完成，正在重新检测环境', 'success')
  setTimeout(() => runCheck(), 1000)
}

/* ================================================================== */
/*  Step 2 — 参数配置                                                   */
/* ================================================================== */

async function loadEnvValues() {
  NProgress.start()
  try {
    const res = await api('/api/env')
    const data = await res.json()
    const v = data.values || {}

    setVal('DOMAIN', v.DOMAIN || 'localhost')
    setChecked('ENABLE_SSL', v.ENABLE_SSL === 'true')
    setVal('SSL_DIR', v.SSL_DIR || './deploy/nginx/ssl')
    setVal('SSL_CERT', v.SSL_CERT || '/etc/nginx/ssl/cert.crt')
    setVal('SSL_KEY', v.SSL_KEY || '/etc/nginx/ssl/cert.key')

    setVal('DB_PASSWORD', validSecret(v.DB_PASSWORD) ? v.DB_PASSWORD : genRandom(16, 'base64url'))
    setVal('JWT_SECRET', validSecret(v.JWT_SECRET) ? v.JWT_SECRET : genRandom(48, 'base64'))
    setVal('ENCRYPTION_KEY', v.ENCRYPTION_KEY || genRandom(32, 'hex'))
    setVal('TRANSPORT_KEY', v.TRANSPORT_KEY || genRandom(32, 'hex'))
    setVal('CAPTCHA_SECRET', v.CAPTCHA_SECRET || genRandom(24, 'hex'))

    setVal('DB_USERNAME', v.DB_USERNAME || 'ublog')
    setVal('DB_DATABASE', v.DB_DATABASE || 'ublog')

    setVal('EMAIL_USER', v.EMAIL_USER || '')
    setVal('EMAIL_PASS', v.EMAIL_PASS || '')
    setVal('REDIS_PASSWORD', v.REDIS_PASSWORD || '')

    setVal('OPENCLAW_URL', v.OPENCLAW_URL || '')
    setVal('OPENCLAW_TOKEN', v.OPENCLAW_TOKEN || '')
    setVal('OPENCLAW_MODEL', v.OPENCLAW_MODEL || 'default')

    setChecked('INIT_SEED_DATA', v.INIT_SEED_DATA === 'true' || !data.exists)
    setChecked('SO360_PUSH_ENABLED', v.SO360_PUSH_ENABLED === 'true')

    toggleSsl()
    deriveSiteUrl()
    envLoaded = true
  } catch (e) {
    showToast('加载配置失败: ' + e.message, 'error')
  }
  NProgress.done()
}

function setVal(id, val)     { const el = $(id); if (el) el.value = val }
function setChecked(id, val) { const el = $(id); if (el) el.checked = val }
function validSecret(s)      { return s && !s.includes('change_me') && s.length > 4 }

function toggleSsl() {
  const section = $('sslSection')
  if (section) section.classList.toggle('open', $('ENABLE_SSL').checked)
}

function deriveSiteUrl() {
  const domain = ($('DOMAIN') ? $('DOMAIN').value.trim() : '') || 'localhost'
  const ssl = $('ENABLE_SSL') ? $('ENABLE_SSL').checked : false
  const proto = ssl ? 'https' : 'http'
  setVal('SITE_URL', proto + '://' + domain)
  const origins = [proto + '://' + domain]
  if (domain !== 'localhost' && !domain.startsWith('www.')) {
    origins.push(proto + '://www.' + domain)
  }
  origins.push(proto + '://' + domain + ':8080')
  setVal('CORS_ORIGIN', origins.join(','))
}

function regenField(id, bytes, enc) {
  setVal(id, genRandom(bytes, enc))
}

function regenAll() {
  regenField('DB_PASSWORD', 16, 'base64url')
  regenField('JWT_SECRET', 48, 'base64')
  regenField('ENCRYPTION_KEY', 32, 'hex')
  regenField('TRANSPORT_KEY', 32, 'hex')
  regenField('CAPTCHA_SECRET', 24, 'hex')
  showToast('已重新生成全部密钥', 'success')
}

function validate() {
  const checks = [
    [($('DOMAIN').value || '').trim(), '请填写域名'],
    [($('DB_PASSWORD').value || '').trim(), '数据库密码不能为空'],
    [validSecret(($('JWT_SECRET').value || '').trim()), '请生成有效的 JWT 密钥'],
    [($('ENCRYPTION_KEY').value || '').trim(), '加密密钥不能为空'],
    [($('TRANSPORT_KEY').value || '').trim(), '传输密钥不能为空'],
  ]
  for (const [ok, msg] of checks) {
    if (!ok) { showToast(msg, 'error'); return false }
  }
  return true
}

function collectConfig() {
  const data = {}
  const textFields = [
    'DOMAIN', 'SSL_DIR', 'SSL_CERT', 'SSL_KEY',
    'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE',
    'JWT_SECRET', 'ENCRYPTION_KEY', 'TRANSPORT_KEY', 'CAPTCHA_SECRET',
    'SITE_URL', 'CORS_ORIGIN',
    'EMAIL_USER', 'EMAIL_PASS', 'REDIS_PASSWORD',
    'OPENCLAW_URL', 'OPENCLAW_TOKEN', 'OPENCLAW_MODEL',
  ]
  for (const id of textFields) {
    const el = $(id)
    if (el) data[id] = el.value.trim()
  }
  data.ENABLE_SSL = $('ENABLE_SSL').checked ? 'true' : 'false'
  data.INIT_SEED_DATA = $('INIT_SEED_DATA').checked ? 'true' : 'false'
  data.SO360_PUSH_ENABLED = $('SO360_PUSH_ENABLED').checked ? 'true' : 'false'
  return data
}

async function saveAndNext() {
  if (!validate()) return
  const data = collectConfig()
  NProgress.start()
  try {
    const res = await api('/api/env', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || '保存失败')
    showToast('配置已保存', 'success')
    goStep(3)
  } catch (e) {
    showToast('保存失败: ' + e.message, 'error')
  }
  NProgress.done()
}

/* ================================================================== */
/*  Step 3 — 部署                                                      */
/* ================================================================== */

async function startDeploy() {
  $('deployHero').style.display = 'none'
  $('deployTermArea').style.display = 'block'
  $('deployActions').style.display = 'flex'
  $('btnNext3').disabled = true
  $('btnRetry').style.display = 'none'

  gsap.from('#deployTermArea', { opacity: 0, y: 10, duration: 0.3, ease: 'power2.out' })

  const body = $('deployTermBody')
  body.innerHTML = ''
  appendTerm(body, '$ docker compose up -d --build', 'tc-cmd')

  deployStartTime = Date.now()
  clearInterval(deployTimerInterval)
  deployTimerInterval = setInterval(updateTimer, 1000)
  updateTimer()

  NProgress.start()

  try {
    const res = await fetch('/api/deploy', {
      headers: { 'Authorization': 'Bearer ' + TOKEN },
    })
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buf = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop()
      for (const line of lines) {
        if (!line.trim()) continue
        try { handleDeployEvent(JSON.parse(line), body) } catch {}
      }
    }
    if (buf.trim()) try { handleDeployEvent(JSON.parse(buf), body) } catch {}
  } catch (e) {
    appendTerm(body, '\nConnection lost: ' + e.message, 'tc-err')
    $('btnRetry').style.display = 'inline-flex'
    renderIcons()
  }

  clearInterval(deployTimerInterval)
  NProgress.done()
}

function handleDeployEvent(ev, body) {
  if (ev.type === 'stdout') {
    appendTerm(body, ev.text, '')
  } else if (ev.type === 'stderr') {
    const cls = /error|fail|fatal/i.test(ev.text) ? 'tc-err' : 'tc-dim'
    appendTerm(body, ev.text, cls)
  } else if (ev.type === 'exit') {
    if (ev.code === 0) {
      appendTerm(body, '\nDeploy completed successfully.', 'tc-ok')
      $('btnNext3').disabled = false
      $('btnRetry').style.display = 'none'
      // 部署成功 — 庆祝彩带
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
      setTimeout(() => confetti({ particleCount: 50, spread: 100, origin: { y: 0.6, x: 0.25 } }), 250)
      setTimeout(() => confetti({ particleCount: 50, spread: 100, origin: { y: 0.6, x: 0.75 } }), 500)
    } else {
      appendTerm(body, '\nDeploy failed with exit code: ' + ev.code, 'tc-err')
      $('btnRetry').style.display = 'inline-flex'
    }
    renderIcons()
  } else if (ev.type === 'error') {
    appendTerm(body, '\nError: ' + ev.text, 'tc-err')
    $('btnRetry').style.display = 'inline-flex'
    renderIcons()
  }
}

function updateTimer() {
  if (!deployStartTime) return
  const secs = Math.floor((Date.now() - deployStartTime) / 1000)
  const m = Math.floor(secs / 60)
  const s = secs % 60
  const el = $('deployTimer')
  if (el) el.textContent = (m > 0 ? m + 'm ' : '') + s + 's'
}

/* ================================================================== */
/*  Step 4 — 状态                                                      */
/* ================================================================== */

async function refreshStatus() {
  const area = $('statusArea')
  area.innerHTML = buildCheckItem(null, '正在加载...', '', 'loading')
  renderIcons()
  NProgress.start()

  try {
    const res = await api('/api/status')
    const containers = await res.json()
    if (!containers.length) {
      area.innerHTML = '<div class="check-item"><div class="check-icon" style="color:var(--text-3)">' +
        '<i data-lucide="inbox"></i></div><div class="check-body">' +
        '<span class="check-name" style="color:var(--text-3)">未检测到运行中的容器</span></div></div>'
      renderIcons()
      NProgress.done()
      return
    }

    let html = '<table class="status-table"><thead><tr><th>服务</th><th>状态</th><th>详情</th></tr></thead><tbody>'
    for (const c of containers) {
      const isRunning = c.state === 'running'
      let badgeCls = 'badge-err'
      let label = c.state || '未知'
      if (isRunning) { badgeCls = 'badge-ok'; label = '运行中' }
      else if (c.state === 'exited') { badgeCls = 'badge-err'; label = '已停止' }
      else if (c.state === 'restarting') { badgeCls = 'badge-warn'; label = '重启中' }

      html += '<tr>'
      html += '<td>' + escHtml(c.name) + '</td>'
      html += '<td><span class="badge ' + badgeCls + '"><span class="badge-dot"></span> ' + label + '</span></td>'
      html += '<td style="color:var(--text-3)">' + escHtml(c.status) + '</td>'
      html += '</tr>'
    }
    html += '</tbody></table>'
    area.innerHTML = html

    // GSAP 交错入场
    gsap.from('.status-table tbody tr', {
      opacity: 0, x: -12, duration: 0.3,
      stagger: 0.06, ease: 'power2.out',
    })

    showAccessLinks()
  } catch (e) {
    area.innerHTML = buildCheckItem('fail', '获取状态失败', e.message, 'fail')
    renderIcons()
  }
  NProgress.done()
}

function showAccessLinks() {
  const config = collectConfig()
  const domain = config.DOMAIN || 'localhost'
  const proto = config.ENABLE_SSL === 'true' ? 'https' : 'http'
  const siteUrl = proto + '://' + domain

  const links = [
    { icon: 'globe', title: '博客前台', url: siteUrl, desc: '浏览博客文章' },
    { icon: 'layout-dashboard', title: '管理后台', url: siteUrl + '/admin/', desc: '管理文章、评论、设置' },
  ]

  $('linksArea').innerHTML = links.map(l =>
    '<a class="link-card" href="' + escHtml(l.url) + '" target="_blank" rel="noopener">' +
    '<div class="link-card-icon"><i data-lucide="' + l.icon + '"></i></div>' +
    '<div class="link-card-info"><h4>' + escHtml(l.title) + '</h4>' +
    '<p>' + escHtml(l.url) + ' — ' + escHtml(l.desc) + '</p></div></a>'
  ).join('')
  renderIcons()
}

/* ================================================================== */
/*  关闭向导                                                           */
/* ================================================================== */

async function shutdownWizard() {
  showToast('向导即将关闭', 'success')
  try { await api('/api/shutdown', { method: 'POST' }) } catch {}
  setTimeout(() => {
    document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;' +
      'height:100vh;color:var(--text-3);font-size:16px;font-family:system-ui,sans-serif">' +
      '部署向导已关闭，可以关闭此页面了</div>'
  }, 600)
}

/* ================================================================== */
/*  流式事件 & 终端通用                                                 */
/* ================================================================== */

function handleStreamEvent(ev, body) {
  if (ev.type === 'stdout') appendTerm(body, ev.text, '')
  else if (ev.type === 'stderr') appendTerm(body, ev.text, 'tc-dim')
  else if (ev.type === 'exit') {
    appendTerm(body, ev.code === 0 ? '\nDone.' : '\nFailed (exit ' + ev.code + ')', ev.code === 0 ? 'tc-ok' : 'tc-err')
  } else if (ev.type === 'error') {
    appendTerm(body, 'Error: ' + ev.text, 'tc-err')
  }
}

function appendTerm(body, text, cls) {
  const span = document.createElement('span')
  if (cls) span.className = cls
  span.textContent = text + '\n'
  body.appendChild(span)
  body.scrollTop = body.scrollHeight
}

/* ================================================================== */
/*  启动                                                               */
/* ================================================================== */

document.addEventListener('DOMContentLoaded', init)
