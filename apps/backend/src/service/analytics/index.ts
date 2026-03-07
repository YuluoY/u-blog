import type { Request } from 'express'
import { type Repository, type DataSource } from 'typeorm'
import { ActivityLog } from '@/module/schema/ActivityLog'
import { getClientIp, getDataSource, resolveIpLocation, parseUserAgent, parseOs } from '@/utils'

/** 前端上报事件 DTO */
interface TrackDto {
  type: string
  sessionId?: string
  path?: string
  referer?: string
  metadata?: Record<string, unknown>
  duration?: number
}

/** 统计概览响应 */
interface OverviewResult {
  todayPv: number
  todayUv: number
  totalPv: number
  totalUv: number
  todayNewUsers: number
  avgDuration: number
}

/** 趋势数据点 */
interface TrendItem {
  date: string
  pv: number
  uv: number
}

/** 页面排行 */
interface PageRankItem {
  path: string
  pv: number
  uv: number
  avgDuration: number
}

/** 地域分布 */
interface GeoItem {
  location: string
  count: number
}

/** 分布项 */
interface DistItem {
  name: string
  count: number
}

/**
 * 行为分析 Service — 负责事件写入和统计聚合查询
 */
export default class AnalyticsService {
  private repo: Repository<ActivityLog>

  constructor(private ds: DataSource) {
    this.repo = ds.getRepository(ActivityLog)
  }

  /** 从 Request 中创建并保存单条或批量行为日志 */
  static async fromRequest(req: Request) {
    const ds = getDataSource(req)
    const svc = new AnalyticsService(ds)
    return svc
  }

  /** 写入单条事件 */
  async track(req: Request, dto: TrackDto): Promise<void> {
    const ip = getClientIp(req)
    const ua = req.headers['user-agent'] || ''
    const { browser, device } = parseUserAgent(ua)
    const os = parseOs(ua)
    const location = await resolveIpLocation(ip).catch(() => null)

    // 从 session/jwt 中取 userId
    const userId = (req as any).session?.userId ?? (req as any).user?.id ?? null

    const log = this.repo.create({
      type: dto.type,
      userId,
      sessionId: dto.sessionId || null,
      ip: ip || null,
      location,
      browser: browser || null,
      device: device || null,
      os: os || null,
      path: dto.path || null,
      referer: dto.referer || req.headers['referer'] || null,
      metadata: dto.metadata ? JSON.stringify(dto.metadata) : null,
      duration: dto.duration ?? null,
    })

    await this.repo.save(log)
  }

  /** 批量写入事件 */
  async trackBatch(req: Request, events: TrackDto[]): Promise<void> {
    if (!events?.length) return

    const ip = getClientIp(req)
    const ua = req.headers['user-agent'] || ''
    const { browser, device } = parseUserAgent(ua)
    const os = parseOs(ua)
    const location = await resolveIpLocation(ip).catch(() => null)
    const userId = (req as any).session?.userId ?? (req as any).user?.id ?? null

    const logs = events.map((dto) =>
      this.repo.create({
        type: dto.type,
        userId,
        sessionId: dto.sessionId || null,
        ip: ip || null,
        location,
        browser: browser || null,
        device: device || null,
        os: os || null,
        path: dto.path || null,
        referer: dto.referer || req.headers['referer'] || null,
        metadata: dto.metadata ? JSON.stringify(dto.metadata) : null,
        duration: dto.duration ?? null,
      })
    )

    await this.repo.save(logs)
  }

  /** 统计概览 */
  async getOverview(): Promise<OverviewResult> {
    const todayStart = startOfDay(new Date())
    const todayEnd = endOfDay(new Date())

    // 今日 PV（所有 page_view 事件）
    const todayPvResult = await this.repo
      .createQueryBuilder('log')
      .where('log.type = :type', { type: 'page_view' })
      .andWhere('log.createdAt BETWEEN :start AND :end', { start: todayStart, end: todayEnd })
      .getCount()
    const todayPv = todayPvResult

    // 今日 UV（按 IP 去重）
    const todayUvResult = await this.repo
      .createQueryBuilder('log')
      .select('COUNT(DISTINCT log.ip)', 'count')
      .where('log.type = :type', { type: 'page_view' })
      .andWhere('log.createdAt BETWEEN :start AND :end', { start: todayStart, end: todayEnd })
      .getRawOne()
    const todayUv = parseInt(todayUvResult?.count || '0', 10)

    // 总 PV
    const totalPv = await this.repo.count({ where: { type: 'page_view' } })

    // 总 UV
    const totalUvResult = await this.repo
      .createQueryBuilder('log')
      .select('COUNT(DISTINCT log.ip)', 'count')
      .where('log.type = :type', { type: 'page_view' })
      .getRawOne()
    const totalUv = parseInt(totalUvResult?.count || '0', 10)

    // 今日新注册用户
    const todayNewUsers = await this.repo
      .createQueryBuilder('log')
      .where('log.type = :type', { type: 'register' })
      .andWhere('log.createdAt BETWEEN :start AND :end', { start: todayStart, end: todayEnd })
      .getCount()

    // 平均停留时长
    const avgResult = await this.repo
      .createQueryBuilder('log')
      .select('AVG(log.duration)', 'avg')
      .where('log.type = :type', { type: 'page_view' })
      .andWhere('log.duration IS NOT NULL')
      .andWhere('log.duration > 0')
      .getRawOne()
    const avgDuration = Math.round(parseFloat(avgResult?.avg || '0'))

    return { todayPv, todayUv, totalPv, totalUv, todayNewUsers, avgDuration }
  }

  /** 最近 N 天 PV / UV 趋势 */
  async getTrends(days: number = 30): Promise<TrendItem[]> {
    const since = startOfDay(new Date(Date.now() - days * 86400000))

    const raw: { date: string; pv: string; uv: string }[] = await this.repo
      .createQueryBuilder('log')
      .select("TO_CHAR(log.createdAt, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)', 'pv')
      .addSelect('COUNT(DISTINCT log.ip)', 'uv')
      .where('log.type = :type', { type: 'page_view' })
      .andWhere('log.createdAt >= :since', { since })
      .groupBy("TO_CHAR(log.createdAt, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .getRawMany()

    // 补齐空日期
    const result: TrendItem[] = []
    const map = new Map(raw.map((r) => [r.date, r]))
    for (let i = 0; i < days; i++) {
      const d = new Date(since.getTime() + i * 86400000)
      const key = d.toISOString().slice(0, 10)
      const row = map.get(key)
      result.push({
        date: key,
        pv: row ? parseInt(row.pv, 10) : 0,
        uv: row ? parseInt(row.uv, 10) : 0,
      })
    }

    return result
  }

  /** 页面排行 Top N */
  async getPageRanks(limit: number = 20): Promise<PageRankItem[]> {
    const raw = await this.repo
      .createQueryBuilder('log')
      .select('log.path', 'path')
      .addSelect('COUNT(*)', 'pv')
      .addSelect('COUNT(DISTINCT log.ip)', 'uv')
      .addSelect('COALESCE(AVG(log.duration), 0)', 'avgDuration')
      .where('log.type = :type', { type: 'page_view' })
      .andWhere('log.path IS NOT NULL')
      .groupBy('log.path')
      .orderBy('pv', 'DESC')
      .limit(limit)
      .getRawMany()

    return raw.map((r: any) => ({
      path: r.path,
      pv: parseInt(r.pv, 10),
      uv: parseInt(r.uv, 10),
      avgDuration: Math.round(parseFloat(r.avgDuration || '0')),
    }))
  }

  /** 地域分布 Top N */
  async getGeoDistribution(limit: number = 20): Promise<GeoItem[]> {
    const raw = await this.repo
      .createQueryBuilder('log')
      .select('log.location', 'location')
      .addSelect('COUNT(*)', 'count')
      .where('log.location IS NOT NULL')
      .groupBy('log.location')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany()

    return raw.map((r: any) => ({
      location: r.location,
      count: parseInt(r.count, 10),
    }))
  }

  /** 浏览器分布 */
  async getBrowserDistribution(limit: number = 10): Promise<DistItem[]> {
    return this._getDistribution('browser', limit)
  }

  /** 设备类型分布 */
  async getDeviceDistribution(limit: number = 10): Promise<DistItem[]> {
    return this._getDistribution('device', limit)
  }

  /** OS 分布 */
  async getOsDistribution(limit: number = 10): Promise<DistItem[]> {
    return this._getDistribution('os', limit)
  }

  /** 分页查询日志列表 */
  async getLogs(params: {
    page?: number
    pageSize?: number
    type?: string
    excludeType?: string
    ip?: string
    path?: string
    userId?: number
    startDate?: string
    endDate?: string
  }) {
    const { page = 1, pageSize = 20, type, excludeType, ip, path, userId, startDate, endDate } = params

    const qb = this.repo.createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)

    if (type) qb.andWhere('log.type = :type', { type })
    if (excludeType) qb.andWhere('log.type != :excludeType', { excludeType })
    if (ip) qb.andWhere('log.ip LIKE :ip', { ip: `%${ip}%` })
    if (path) qb.andWhere('log.path LIKE :path', { path: `%${path}%` })
    if (userId) qb.andWhere('log.userId = :userId', { userId })
    if (startDate) qb.andWhere('log.createdAt >= :startDate', { startDate })
    if (endDate) qb.andWhere('log.createdAt <= :endDate', { endDate: endDate + ' 23:59:59' })

    const [list, total] = await qb.getManyAndCount()

    return {
      list: list.map((log) => ({
        ...log,
        metadata: log.metadata ? safeJsonParse(log.metadata) : null,
        user: log.user ? { id: log.user.id, username: (log.user as any).username, namec: (log.user as any).namec } : null,
      })),
      total,
      page,
      pageSize,
    }
  }

  /** 按精确 IP 清理行为日志，返回删除条数 */
  async clearLogsByIp(ip: string): Promise<number> {
    const targetIp = ip.trim()
    if (!targetIp) {
      throw new Error('IP 不能为空')
    }

    const result = await this.repo
      .createQueryBuilder()
      .delete()
      .from(ActivityLog)
      .where('ip = :ip', { ip: targetIp })
      .execute()

    return result.affected ?? 0
  }

  /** 通用分布统计内部方法 */
  private async _getDistribution(field: string, limit: number): Promise<DistItem[]> {
    const raw = await this.repo
      .createQueryBuilder('log')
      .select(`log.${field}`, 'name')
      .addSelect('COUNT(*)', 'count')
      .where(`log.${field} IS NOT NULL`)
      .groupBy(`log.${field}`)
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany()

    return raw.map((r: any) => ({
      name: r.name,
      count: parseInt(r.count, 10),
    }))
  }
}

/* ---- 日期工具 ---- */
function startOfDay(d: Date): Date {
  const r = new Date(d)
  r.setHours(0, 0, 0, 0)
  return r
}

function endOfDay(d: Date): Date {
  const r = new Date(d)
  r.setHours(23, 59, 59, 999)
  return r
}

function safeJsonParse(str: string): Record<string, unknown> | null {
  try { return JSON.parse(str) } catch { return null }
}
