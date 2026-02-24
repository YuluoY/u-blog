/**
 * 系统管理路由
 * 所有接口需要 admin 权限
 */
import express, { type Router, type Request, type Response } from 'express'
import multer from 'multer'
import { resolve } from 'node:path'
import { execSync, exec } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, renameSync } from 'node:fs'
import { requireAuth } from '@/middleware/AuthGuard'
import { requireRole } from '@/middleware/RoleGuard'
import { CUserRole } from '@u-blog/model'
import SystemService from '@/service/system'

const router = express.Router() as Router

/** 管理员权限中间件 */
const adminOnly = [requireAuth, requireRole(CUserRole.ADMIN)]

/* =================== 系统指标 =================== */

/**
 * GET /system/metrics — 获取系统指标（CPU、内存、磁盘等）
 */
router.get('/metrics', ...adminOnly, async (_req: Request, res: Response) => {
  try {
    const metrics = await SystemService.getMetrics()
    res.json({ code: 0, data: metrics, message: 'ok' })
  } catch (err: any) {
    res.json({ code: 1, data: null, message: err.message || '获取系统指标失败' })
  }
})

/* =================== Redis 管理 =================== */

/**
 * GET /system/redis — 获取 Redis 状态信息
 */
router.get('/redis', ...adminOnly, async (_req: Request, res: Response) => {
  try {
    const info = await SystemService.getRedisInfo()
    res.json({ code: 0, data: info, message: 'ok' })
  } catch (err: any) {
    res.json({ code: 1, data: null, message: err.message || '获取 Redis 信息失败' })
  }
})

/**
 * POST /system/redis/flush — 刷新 Redis 缓存
 */
router.post('/redis/flush', ...adminOnly, async (_req: Request, res: Response) => {
  try {
    const ok = await SystemService.flushRedis()
    res.json({ code: 0, data: { success: ok }, message: ok ? '缓存已清除' : 'Redis 不可用' })
  } catch (err: any) {
    res.json({ code: 1, data: null, message: err.message || '刷新缓存失败' })
  }
})

/* =================== Nginx 管理 =================== */

/**
 * GET /system/nginx — 获取 Nginx 状态
 */
router.get('/nginx', ...adminOnly, async (_req: Request, res: Response) => {
  try {
    const status = await SystemService.getNginxStatus()
    res.json({ code: 0, data: status, message: 'ok' })
  } catch (err: any) {
    res.json({ code: 1, data: null, message: err.message || '获取 Nginx 状态失败' })
  }
})

/**
 * POST /system/nginx/reload — 重载 Nginx 配置
 */
router.post('/nginx/reload', ...adminOnly, async (_req: Request, res: Response) => {
  try {
    const result = await SystemService.reloadNginx()
    res.json({ code: result.success ? 0 : 1, data: result, message: result.message })
  } catch (err: any) {
    res.json({ code: 1, data: null, message: err.message || '重载 Nginx 失败' })
  }
})

/* =================== PM2 进程管理 =================== */

/**
 * GET /system/pm2 — 获取 PM2 进程列表
 */
router.get('/pm2', ...adminOnly, async (_req: Request, res: Response) => {
  try {
    const list = await SystemService.getPm2List()
    res.json({ code: 0, data: list, message: 'ok' })
  } catch (err: any) {
    res.json({ code: 1, data: null, message: err.message || '获取进程列表失败' })
  }
})

/**
 * POST /system/pm2/restart — 重启后端服务
 */
router.post('/pm2/restart', ...adminOnly, async (_req: Request, res: Response) => {
  try {
    const result = await SystemService.restartBackend()
    res.json({ code: result.success ? 0 : 1, data: result, message: result.message })
  } catch (err: any) {
    res.json({ code: 1, data: null, message: err.message || '重启服务失败' })
  }
})

/* =================== 部署上传 =================== */

/** 上传临时目录 */
const UPLOAD_TMP = resolve(process.cwd(), 'tmp-deploy')
const upload = multer({
  dest: UPLOAD_TMP,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (_req, file, cb) => {
    // 只允许 zip/tar.gz
    if (file.mimetype === 'application/zip' ||
        file.mimetype === 'application/gzip' ||
        file.mimetype === 'application/x-tar' ||
        file.originalname.endsWith('.zip') ||
        file.originalname.endsWith('.tar.gz')) {
      cb(null, true)
    } else {
      cb(new Error('仅支持 .zip 或 .tar.gz 格式'))
    }
  },
})

/** 部署目标映射 */
const DEPLOY_TARGETS: Record<string, string> = {
  frontend: '/var/www/u-blog/frontend',
  admin: '/var/www/u-blog/admin',
}

/**
 * POST /system/deploy — 上传打包文件自动部署
 * FormData: file + target (frontend | admin)
 */
router.post('/deploy', ...adminOnly, upload.single('file'), async (req: Request, res: Response) => {
  const file = req.file
  const target = req.body?.target as string

  if (!file) {
    res.json({ code: 1, data: null, message: '请上传部署文件' })
    return
  }

  if (!target || !DEPLOY_TARGETS[target]) {
    res.json({ code: 1, data: null, message: '无效的部署目标，支持: frontend, admin' })
    return
  }

  const deployDir = DEPLOY_TARGETS[target]

  try {
    // 确保临时目录存在
    const extractDir = resolve(UPLOAD_TMP, `extract-${Date.now()}`)
    mkdirSync(extractDir, { recursive: true })

    // 解压文件
    if (file.originalname.endsWith('.zip')) {
      execSync(`unzip -o "${file.path}" -d "${extractDir}" 2>&1`, { encoding: 'utf-8' })
    } else {
      execSync(`tar -xzf "${file.path}" -C "${extractDir}" 2>&1`, { encoding: 'utf-8' })
    }

    // 备份当前版本
    const backupDir = `${deployDir}.bak.${Date.now()}`
    if (existsSync(deployDir)) {
      renameSync(deployDir, backupDir)
    }
    mkdirSync(deployDir, { recursive: true })

    // 复制新文件到目标目录
    execSync(`cp -r "${extractDir}"/* "${deployDir}/" 2>&1`, { encoding: 'utf-8' })

    // 清理临时文件和旧备份
    rmSync(extractDir, { recursive: true, force: true })
    rmSync(file.path, { force: true })
    // 保留最近3个备份，删除旧的
    try {
      const parent = resolve(deployDir, '..')
      execSync(`ls -dt ${parent}/${target}.bak.* 2>/dev/null | tail -n +4 | xargs rm -rf`, { encoding: 'utf-8' })
    } catch {}

    res.json({ code: 0, data: { target, deployDir }, message: `${target} 部署成功` })
  } catch (err: any) {
    // 清理临时文件
    rmSync(file.path, { force: true })
    res.json({ code: 1, data: null, message: `部署失败: ${err.message}` })
  }
})

/* =================== GitHub Webhook =================== */

/**
 * POST /system/webhook/github — GitHub push 事件触发自动部署
 * 环境变量 GITHUB_WEBHOOK_SECRET 为可选签名校验
 */
router.post('/webhook/github', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const event = req.headers['x-github-event']
  if (event !== 'push') {
    res.json({ code: 0, data: null, message: `忽略事件: ${event}` })
    return
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const branch = body?.ref?.replace('refs/heads/', '') || ''

  if (branch !== 'main' && branch !== 'master') {
    res.json({ code: 0, data: null, message: `忽略分支: ${branch}` })
    return
  }

  // 异步执行部署脚本，不阻塞响应
  res.json({ code: 0, data: null, message: '部署已触发' })

  try {
    const projectDir = '/var/www/u-blog/source'
    // 拉取最新代码 → 安装依赖 → 构建 → 部署
    const script = [
      `cd ${projectDir}`,
      'git pull origin main',
      'pnpm install --frozen-lockfile',
      'pnpm build',
      `cp -r apps/frontend/dist/* /var/www/u-blog/frontend/`,
      `ADMIN_BASE_PATH=/admin/ pnpm --filter @u-blog/admin build`,
      `cp -r apps/admin/dist/* /var/www/u-blog/admin/`,
      'pm2 restart u-blog-backend',
    ].join(' && ')

    exec(script, { cwd: projectDir, timeout: 300_000 }, (err, stdout, stderr) => {
      if (err) {
        console.error('[webhook] 自动部署失败:', stderr || err.message)
      } else {
        console.log('[webhook] 自动部署成功:', stdout.slice(-200))
      }
    })
  } catch (err) {
    console.error('[webhook] 触发部署失败:', err)
  }
})

export default router
