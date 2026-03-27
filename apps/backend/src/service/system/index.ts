/**
 * 系统管理服务
 * 提供服务器指标监控、Nginx/Redis 管理、部署操作
 */
import type { Request } from 'express'
import os from 'node:os'
import { basename, extname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { execSync, exec, execFileSync } from 'node:child_process'
import appCfg from '@/app'
import { getDataSource } from '@/utils'
import { cacheDel, getRedis } from '@/service/cache'

/** 系统指标快照 */
export interface ISystemMetrics {
  /** CPU 使用率 (0-100) */
  cpuUsage: number
  /** CPU 核心数 */
  cpuCores: number
  /** CPU 型号 */
  cpuModel: string
  /** 总内存 (bytes) */
  memTotal: number
  /** 已用内存 (bytes) */
  memUsed: number
  /** 内存使用率 (0-100) */
  memUsage: number
  /** 磁盘总量 (bytes) */
  diskTotal: number
  /** 磁盘已用 (bytes) */
  diskUsed: number
  /** 磁盘使用率 (0-100) */
  diskUsage: number
  /** 系统运行时间 (秒) */
  uptime: number
  /** 操作系统信息 */
  platform: string
  /** 主机名 */
  hostname: string
  /** Node.js 版本 */
  nodeVersion: string
  /** 系统负载 (1/5/15 分钟) */
  loadAvg: number[]
  /** 网络接口信息 */
  networkInterfaces: { name: string; address: string; family: string }[]
}

/** Redis 状态信息 */
export interface IRedisInfo {
  connected: boolean
  version?: string
  usedMemory?: string
  usedMemoryPeak?: string
  connectedClients?: number
  totalKeys?: number
  uptime?: number
  hitRate?: string
}

/** Nginx 状态信息 */
export interface INginxStatus {
  running: boolean
  version?: string
  configTest?: string
  workerProcesses?: number
}

/** PM2 进程信息 */
export interface IPm2Process {
  /** PM2 进程 ID */
  pm_id: number
  /** 进程名称 */
  name: string
  /** 运行状态 */
  status: string
  /** CPU 使用率 */
  cpu: number
  /** 内存使用 (bytes) */
  memory: number
  /** 运行时长 (ms) */
  uptime: number
  /** 重启次数 */
  restarts: number
  /** 进程 PID */
  pid: number
}

/** 文章计数漂移项 */
export interface IDataCounterArticleDrift {
  id: number
  title: string
  storedLikeCount: number
  actualLikeCount: number
  storedCommentCount: number
  actualCommentCount: number
}

/** 评论点赞计数漂移项 */
export interface IDataCounterCommentDrift {
  id: number
  articleId: number | null
  storedLikeCount: number
  actualLikeCount: number
}

/** 数据计数审计结果 */
export interface IDataCounterAudit {
  sitePageViews: number
  siteUniqueVisitors: number
  siteLikeTotal: number
  siteCommentVisibleTotal: number
  siteStandaloneCommentVisibleTotal: number
  siteDeletedCommentTotal: number
  articleLikeStoredTotal: number
  articleLikeActualTotal: number
  articleCommentStoredTotal: number
  articleCommentActualTotal: number
  commentLikeStoredTotal: number
  commentLikeActualTotal: number
  driftArticleCount: number
  driftCommentCount: number
  driftArticles: IDataCounterArticleDrift[]
  driftComments: IDataCounterCommentDrift[]
  /**
   * 说明 viewCount 的语义，避免误以为可以通过 View 表完全反推文章阅读量。
   */
  articleViewCountNote: string
}

/** 计数修复结果 */
export interface IDataCounterRepairResult {
  repairedArticleLikeRows: number
  repairedArticleCommentRows: number
  repairedCommentLikeRows: number
  audit: IDataCounterAudit
}

/** 单个备份文件信息 */
export interface IBackupArtifact {
  name: string
  size: number
  createdAt: string
  updatedAt: string
  tableCount: number
  totalRows: number
  includesUploads: boolean
  includesStatic: boolean
}

/** 备份清单元数据 */
interface IBackupManifest {
  createdAt: string
  tableCount: number
  totalRows: number
  includesUploads: boolean
  includesStatic: boolean
  tables: Array<{ name: string; rows: number }>
}

/**
 * 系统管理服务类
 */
export default class SystemService {
  /** 手动备份目录：默认放在 backend 根目录，线上可通过 volume 持久化 */
  private static readonly BACKUP_DIR = resolve(process.cwd(), 'backups')

  /** 备份归档前缀 */
  private static readonly BACKUP_PREFIX = 'u-blog-backup-'

  /**
   * 确保备份目录存在
   */
  private static ensureBackupDir(): string {
    if (!existsSync(this.BACKUP_DIR)) {
      mkdirSync(this.BACKUP_DIR, { recursive: true })
    }
    return this.BACKUP_DIR
  }

  /**
   * 备份 sidecar 元数据文件路径
   */
  private static getBackupMetaPath(archivePath: string): string {
    return `${archivePath}.meta.json`
  }

  /**
   * 将归档路径转换为对前端友好的列表项
   */
  private static toBackupArtifact(archivePath: string): IBackupArtifact {
    const stat = statSync(archivePath)
    const archiveName = basename(archivePath)
    const metaPath = this.getBackupMetaPath(archivePath)
    const manifest: IBackupManifest | null = existsSync(metaPath)
      ? JSON.parse(readFileSync(metaPath, 'utf-8')) as IBackupManifest
      : null

    return {
      name: archiveName,
      size: stat.size,
      createdAt: manifest?.createdAt ?? stat.birthtime.toISOString(),
      updatedAt: stat.mtime.toISOString(),
      tableCount: manifest?.tableCount ?? 0,
      totalRows: manifest?.totalRows ?? 0,
      includesUploads: manifest?.includesUploads ?? false,
      includesStatic: manifest?.includesStatic ?? false,
    }
  }

  /**
   * 读取当前博客数据计数审计结果。
   *
   * 这里专门审计“文章/评论冗余计数字段”与真实明细表之间的一致性，
   * 目的是为后台系统管理提供可观测、可修复的数据健康状态。
   */
  static async auditContentCounters(req: Request): Promise<IDataCounterAudit> {
    const ds = getDataSource(req)

    const [siteStatsRow] = await ds.query(`
      SELECT
        (SELECT COUNT(*)::bigint FROM activity_log WHERE type = 'page_view') AS "sitePageViews",
        (SELECT COUNT(DISTINCT ip)::bigint FROM activity_log WHERE type = 'page_view') AS "siteUniqueVisitors",
        (SELECT COUNT(*)::bigint FROM "like") AS "siteLikeTotal",
        (SELECT COUNT(*)::bigint FROM comment WHERE "deletedAt" IS NULL) AS "siteCommentVisibleTotal",
        (SELECT COUNT(*)::bigint FROM comment WHERE "articleId" IS NULL AND "deletedAt" IS NULL) AS "siteStandaloneCommentVisibleTotal",
        (SELECT COUNT(*)::bigint FROM comment WHERE "deletedAt" IS NOT NULL) AS "siteDeletedCommentTotal",
        (SELECT COALESCE(SUM("likeCount"), 0)::bigint FROM article) AS "articleLikeStoredTotal",
        (SELECT COUNT(*)::bigint FROM "like" WHERE "articleId" IS NOT NULL) AS "articleLikeActualTotal",
        (SELECT COALESCE(SUM("commentCount"), 0)::bigint FROM article) AS "articleCommentStoredTotal",
        (SELECT COUNT(*)::bigint FROM comment WHERE "articleId" IS NOT NULL AND "deletedAt" IS NULL) AS "articleCommentActualTotal",
        (SELECT COALESCE(SUM("likeCount"), 0)::bigint FROM comment WHERE "deletedAt" IS NULL) AS "commentLikeStoredTotal",
        (SELECT COUNT(*)::bigint FROM "like" WHERE "commentId" IS NOT NULL) AS "commentLikeActualTotal"
    `) as Array<Record<string, string | number>>

    const driftArticles = await ds.query(`
      SELECT
        a.id,
        a.title,
        a."likeCount" AS "storedLikeCount",
        COALESCE(al.actual_like_count, 0) AS "actualLikeCount",
        a."commentCount" AS "storedCommentCount",
        COALESCE(ac.actual_comment_count, 0) AS "actualCommentCount"
      FROM article a
      LEFT JOIN (
        SELECT "articleId" AS id, COUNT(*)::int AS actual_like_count
        FROM "like"
        WHERE "articleId" IS NOT NULL
        GROUP BY "articleId"
      ) al ON al.id = a.id
      LEFT JOIN (
        SELECT "articleId" AS id, COUNT(*)::int AS actual_comment_count
        FROM comment
        WHERE "articleId" IS NOT NULL AND "deletedAt" IS NULL
        GROUP BY "articleId"
      ) ac ON ac.id = a.id
      WHERE a."likeCount" <> COALESCE(al.actual_like_count, 0)
         OR a."commentCount" <> COALESCE(ac.actual_comment_count, 0)
      ORDER BY a.id DESC
      LIMIT 50
    `) as IDataCounterArticleDrift[]

    const driftComments = await ds.query(`
      SELECT
        c.id,
        c."articleId" AS "articleId",
        c."likeCount" AS "storedLikeCount",
        COALESCE(cl.actual_like_count, 0) AS "actualLikeCount"
      FROM comment c
      LEFT JOIN (
        SELECT "commentId" AS id, COUNT(*)::int AS actual_like_count
        FROM "like"
        WHERE "commentId" IS NOT NULL
        GROUP BY "commentId"
      ) cl ON cl.id = c.id
      WHERE c."deletedAt" IS NULL
        AND c."likeCount" <> COALESCE(cl.actual_like_count, 0)
      ORDER BY c.id DESC
      LIMIT 50
    `) as IDataCounterCommentDrift[]

    return {
      sitePageViews: Number(siteStatsRow?.sitePageViews ?? 0),
      siteUniqueVisitors: Number(siteStatsRow?.siteUniqueVisitors ?? 0),
      siteLikeTotal: Number(siteStatsRow?.siteLikeTotal ?? 0),
      siteCommentVisibleTotal: Number(siteStatsRow?.siteCommentVisibleTotal ?? 0),
      siteStandaloneCommentVisibleTotal: Number(siteStatsRow?.siteStandaloneCommentVisibleTotal ?? 0),
      siteDeletedCommentTotal: Number(siteStatsRow?.siteDeletedCommentTotal ?? 0),
      articleLikeStoredTotal: Number(siteStatsRow?.articleLikeStoredTotal ?? 0),
      articleLikeActualTotal: Number(siteStatsRow?.articleLikeActualTotal ?? 0),
      articleCommentStoredTotal: Number(siteStatsRow?.articleCommentStoredTotal ?? 0),
      articleCommentActualTotal: Number(siteStatsRow?.articleCommentActualTotal ?? 0),
      commentLikeStoredTotal: Number(siteStatsRow?.commentLikeStoredTotal ?? 0),
      commentLikeActualTotal: Number(siteStatsRow?.commentLikeActualTotal ?? 0),
      driftArticleCount: driftArticles.length,
      driftCommentCount: driftComments.length,
      driftArticles,
      driftComments,
      articleViewCountNote: '网站总评论统计的是 comment 表中未删除的可见评论；文章评论冗余计数字段只覆盖 articleId 不为空的评论，因此独立页面评论、留言板评论与已删除评论不会计入 article.commentCount。',
    }
  }

  /**
   * 修复文章点赞数、文章评论数、评论点赞数的冗余字段。
   *
   * 注意：这里不修复 article.viewCount，因为历史 View 日志并非完整点击明细，
   * 用它覆盖文章阅读量会改变既有业务语义。
   */
  static async repairContentCounters(req: Request): Promise<IDataCounterRepairResult> {
    const ds = getDataSource(req)

    const [repairedArticleLikeRows, repairedArticleCommentRows, repairedCommentLikeRows] = await ds.transaction(async (manager) =>
    {
      const articleLikeRows = await manager.query(`
        WITH recalculated AS (
          SELECT
            a.id,
            COALESCE(al.actual_like_count, 0)::int AS next_count
          FROM article a
          LEFT JOIN (
            SELECT "articleId" AS id, COUNT(*)::int AS actual_like_count
            FROM "like"
            WHERE "articleId" IS NOT NULL
            GROUP BY "articleId"
          ) al ON al.id = a.id
        )
        UPDATE article a
        SET "likeCount" = recalculated.next_count
        FROM recalculated
        WHERE a.id = recalculated.id
          AND a."likeCount" <> recalculated.next_count
        RETURNING a.id
      `)

      const articleCommentRows = await manager.query(`
        WITH recalculated AS (
          SELECT
            a.id,
            COALESCE(ac.actual_comment_count, 0)::int AS next_count
          FROM article a
          LEFT JOIN (
            SELECT "articleId" AS id, COUNT(*)::int AS actual_comment_count
            FROM comment
            WHERE "articleId" IS NOT NULL AND "deletedAt" IS NULL
            GROUP BY "articleId"
          ) ac ON ac.id = a.id
        )
        UPDATE article a
        SET "commentCount" = recalculated.next_count
        FROM recalculated
        WHERE a.id = recalculated.id
          AND a."commentCount" <> recalculated.next_count
        RETURNING a.id
      `)

      const commentLikeRows = await manager.query(`
        WITH recalculated AS (
          SELECT
            c.id,
            COALESCE(cl.actual_like_count, 0)::int AS next_count
          FROM comment c
          LEFT JOIN (
            SELECT "commentId" AS id, COUNT(*)::int AS actual_like_count
            FROM "like"
            WHERE "commentId" IS NOT NULL
            GROUP BY "commentId"
          ) cl ON cl.id = c.id
          WHERE c."deletedAt" IS NULL
        )
        UPDATE comment c
        SET "likeCount" = recalculated.next_count
        FROM recalculated
        WHERE c.id = recalculated.id
          AND c."likeCount" <> recalculated.next_count
        RETURNING c.id
      `)

      return [articleLikeRows.length, articleCommentRows.length, commentLikeRows.length] as const
    })

    await cacheDel('site-overview')
    const audit = await this.auditContentCounters(req)

    return {
      repairedArticleLikeRows,
      repairedArticleCommentRows,
      repairedCommentLikeRows,
      audit,
    }
  }

  /**
   * 创建一份完整博客备份。
   *
   * 备份内容：
   * - 当前数据库所有实体表数据（JSON）
   * - public/uploads
   * - public/static
   *
   * 线上与本地开发使用同一套导出逻辑，不依赖宿主机专有命令。
   */
  static async createBlogBackup(req: Request): Promise<IBackupArtifact> {
    const ds = getDataSource(req)
    const backupDir = this.ensureBackupDir()
    const createdAt = new Date()
    const stamp = createdAt.toISOString().replace(/[:]/g, '-')
    const archiveName = `${this.BACKUP_PREFIX}${stamp}.tar.gz`
    const archivePath = join(backupDir, archiveName)
    const workspaceDir = mkdtempSync(join(tmpdir(), 'u-blog-backup-'))
    const dataDir = join(workspaceDir, 'database')
    const filesDir = join(workspaceDir, 'files')

    mkdirSync(dataDir, { recursive: true })
    mkdirSync(filesDir, { recursive: true })

    const manifest: IBackupManifest = {
      createdAt: createdAt.toISOString(),
      tableCount: 0,
      totalRows: 0,
      includesUploads: false,
      includesStatic: false,
      tables: [],
    }

    try {
      /**
       * 直接按实体元数据导出真实表，避免维护第二份“要备哪些表”的手工清单。
       */
      const tableNames = [...new Set(ds.entityMetadatas.map(meta => meta.tableName))]
        .sort((a, b) => a.localeCompare(b))

      for (const tableName of tableNames) {
        const rows = await ds.query(`SELECT * FROM "${tableName}"`)
        manifest.tables.push({ name: tableName, rows: rows.length })
        manifest.totalRows += rows.length
        writeFileSync(join(dataDir, `${tableName}.json`), JSON.stringify(rows, null, 2))
      }
      manifest.tableCount = manifest.tables.length

      const uploadsDir = join(appCfg.staticPath, 'uploads')
      if (existsSync(uploadsDir)) {
        cpSync(uploadsDir, join(filesDir, 'uploads'), { recursive: true })
        manifest.includesUploads = true
      }

      const staticDir = join(appCfg.staticPath, 'static')
      if (existsSync(staticDir)) {
        cpSync(staticDir, join(filesDir, 'static'), { recursive: true })
        manifest.includesStatic = true
      }

      writeFileSync(join(workspaceDir, 'manifest.json'), JSON.stringify(manifest, null, 2))

      execFileSync('tar', ['-czf', archivePath, '-C', workspaceDir, '.'])
      writeFileSync(this.getBackupMetaPath(archivePath), JSON.stringify(manifest, null, 2))

      return this.toBackupArtifact(archivePath)
    } finally {
      rmSync(workspaceDir, { recursive: true, force: true })
    }
  }

  /**
   * 列出已有备份文件
   */
  static listBackups(): IBackupArtifact[] {
    const backupDir = this.ensureBackupDir()
    return readdirSync(backupDir)
      .filter(name => name.startsWith(this.BACKUP_PREFIX) && extname(name) === '.gz')
      .map(name => this.toBackupArtifact(join(backupDir, name)))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  /**
   * 获取备份文件绝对路径，供下载使用。
   * 这里显式校验文件名，避免目录穿越。
   */
  static getBackupFilePath(name: string): string {
    const backupDir = this.ensureBackupDir()
    const normalizedName = basename(name)
    if (!normalizedName.startsWith(this.BACKUP_PREFIX) || !normalizedName.endsWith('.tar.gz')) {
      throw new Error('非法备份文件名')
    }

    const filePath = join(backupDir, normalizedName)
    if (!existsSync(filePath)) {
      throw new Error('备份文件不存在')
    }
    return filePath
  }

  /**
   * 获取 CPU 使用率（采样 500ms）
   */
  private static async getCpuUsage(): Promise<number> {
    const cpus1 = os.cpus()
    await new Promise(r => setTimeout(r, 500))
    const cpus2 = os.cpus()

    let totalIdle = 0, totalTick = 0
    for (let i = 0; i < cpus2.length; i++) {
      const c1 = cpus1[i], c2 = cpus2[i]
      const idle = c2.times.idle - c1.times.idle
      const total = Object.values(c2.times).reduce((a, b) => a + b) -
                    Object.values(c1.times).reduce((a, b) => a + b)
      totalIdle += idle
      totalTick += total
    }
    return totalTick === 0 ? 0 : Math.round((1 - totalIdle / totalTick) * 100)
  }

  /**
   * 获取磁盘信息
   */
  private static getDiskInfo(): { total: number; used: number; usage: number } {
    try {
      const output = execSync("df -k / | tail -1 | awk '{print $2, $3}'", { encoding: 'utf-8' }).trim()
      const [totalKB, usedKB] = output.split(/\s+/).map(Number)
      const total = totalKB * 1024
      const used = usedKB * 1024
      return { total, used, usage: Math.round((used / total) * 100) }
    } catch {
      return { total: 0, used: 0, usage: 0 }
    }
  }

  /**
   * 获取完整系统指标
   */
  static async getMetrics(): Promise<ISystemMetrics> {
    const cpuUsage = await this.getCpuUsage()
    const disk = this.getDiskInfo()
    const memTotal = os.totalmem()
    const memFree = os.freemem()
    const memUsed = memTotal - memFree
    const cpuInfo = os.cpus()[0]
    const nets = os.networkInterfaces()
    const networkInterfaces: ISystemMetrics['networkInterfaces'] = []

    for (const [name, ifaces] of Object.entries(nets)) {
      for (const iface of ifaces || []) {
        if (!iface.internal && iface.family === 'IPv4') {
          networkInterfaces.push({ name, address: iface.address, family: iface.family })
        }
      }
    }

    return {
      cpuUsage,
      cpuCores: os.cpus().length,
      cpuModel: cpuInfo?.model || 'Unknown',
      memTotal,
      memUsed,
      memUsage: Math.round((memUsed / memTotal) * 100),
      diskTotal: disk.total,
      diskUsed: disk.used,
      diskUsage: disk.usage,
      uptime: os.uptime(),
      platform: `${os.type()} ${os.release()} (${os.arch()})`,
      hostname: os.hostname(),
      nodeVersion: process.version,
      loadAvg: os.loadavg().map(v => Math.round(v * 100) / 100),
      networkInterfaces,
    }
  }

  /**
   * 获取 Redis 信息
   */
  static async getRedisInfo(): Promise<IRedisInfo> {
    const redis = getRedis()
    if (!redis) return { connected: false }

    try {
      const info = await redis.info()
      const parse = (key: string) => {
        const match = info.match(new RegExp(`${key}:(.+)`))
        return match?.[1]?.trim()
      }

      const hits = parseInt(parse('keyspace_hits') || '0')
      const misses = parseInt(parse('keyspace_misses') || '0')
      const total = hits + misses
      const hitRate = total > 0 ? `${Math.round((hits / total) * 100)}%` : 'N/A'

      // 获取 key 总数
      const dbInfo = parse('db0')
      const keysMatch = dbInfo?.match(/keys=(\d+)/)
      const totalKeys = keysMatch ? parseInt(keysMatch[1]) : 0

      return {
        connected: true,
        version: parse('redis_version') || undefined,
        usedMemory: parse('used_memory_human') || undefined,
        usedMemoryPeak: parse('used_memory_peak_human') || undefined,
        connectedClients: parseInt(parse('connected_clients') || '0'),
        totalKeys,
        uptime: parseInt(parse('uptime_in_seconds') || '0'),
        hitRate,
      }
    } catch {
      return { connected: false }
    }
  }

  /**
   * 刷新 Redis 缓存
   */
  static async flushRedis(): Promise<boolean> {
    const redis = getRedis()
    if (!redis) return false
    try {
      // 仅清除 ublog: 前缀的 key，避免影响其他服务
      let cursor = '0'
      do {
        const [next, keys] = await redis.scan(cursor, 'MATCH', 'ublog:*', 'COUNT', 100)
        cursor = next
        if (keys.length > 0) await redis.del(...keys)
      } while (cursor !== '0')
      return true
    } catch {
      return false
    }
  }

  /**
   * 获取 Nginx 状态
   */
  static async getNginxStatus(): Promise<INginxStatus> {
    try {
      const running = (() => {
        try {
          execSync('pgrep -x nginx', { encoding: 'utf-8' })
          return true
        } catch { return false }
      })()

      let version: string | undefined
      try {
        version = execSync('nginx -v 2>&1', { encoding: 'utf-8' }).trim().replace('nginx version: nginx/', '')
      } catch {}

      let configTest: string | undefined
      try {
        configTest = execSync('nginx -t 2>&1', { encoding: 'utf-8' }).trim()
      } catch (e: any) {
        configTest = e.stderr || e.message
      }

      let workerProcesses = 0
      try {
        const output = execSync('pgrep -c nginx', { encoding: 'utf-8' }).trim()
        workerProcesses = Math.max(0, parseInt(output) - 1) // 减去 master
      } catch {}

      return { running, version, configTest, workerProcesses }
    } catch {
      return { running: false }
    }
  }

  /**
   * 重载 Nginx 配置（不中断服务）
   */
  static async reloadNginx(): Promise<{ success: boolean; message: string }> {
    try {
      // 先测试配置
      execSync('nginx -t 2>&1', { encoding: 'utf-8' })
      // 配置正确才 reload
      execSync('nginx -s reload 2>&1', { encoding: 'utf-8' })
      return { success: true, message: 'Nginx 配置已重载' }
    } catch (e: any) {
      return { success: false, message: e.stderr || e.message || '重载失败' }
    }
  }

  /**
   * 获取 PM2 进程列表（结构化）
   */
  static async getPm2List(): Promise<IPm2Process[]> {
    try {
      const output = execSync('pm2 jlist 2>/dev/null', { encoding: 'utf-8' })
      const raw = JSON.parse(output) as any[]
      return raw.map((p: any) => ({
        pm_id: p.pm_id ?? 0,
        name: p.name ?? '',
        status: p.pm2_env?.status ?? 'unknown',
        cpu: p.monit?.cpu ?? 0,
        memory: p.monit?.memory ?? 0,
        uptime: p.pm2_env?.pm_uptime ? Date.now() - p.pm2_env.pm_uptime : 0,
        restarts: p.pm2_env?.restart_time ?? 0,
        pid: p.pid ?? 0,
      }))
    } catch {
      return []
    }
  }

  /**
   * 重启 PM2 中的后端进程
   */
  static async restartBackend(): Promise<{ success: boolean; message: string }> {
    try {
      execSync('pm2 restart u-blog-backend 2>&1', { encoding: 'utf-8' })
      return { success: true, message: '后端服务已重启' }
    } catch (e: any) {
      return { success: false, message: e.stderr || e.message || '重启失败' }
    }
  }

  /**
   * 获取 PM2 进程日志（最近 N 行）
   * @param name 进程名称
   * @param lines 日志行数（默认 200，上限 500）
   */
  static async getPm2Logs(name: string, lines = 200): Promise<string> {
    const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '')
    if (!safeName) throw new Error('无效的进程名称')
    const safeLines = Math.min(Math.max(lines, 10), 500)
    try {
      const output = execSync(`pm2 logs ${safeName} --nostream --lines ${safeLines} 2>&1`, {
        encoding: 'utf-8',
        timeout: 10_000,
      })
      return output.trim()
    } catch (e: any) {
      return e.stdout || e.stderr || '获取日志失败'
    }
  }
}
