/**
 * 系统管理服务
 * 提供服务器指标监控、Nginx/Redis 管理、部署操作
 */
import os from 'node:os'
import { execSync, exec } from 'node:child_process'
import { getRedis } from '@/service/cache'

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

/**
 * 系统管理服务类
 */
export default class SystemService {

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
   * 获取 PM2 进程列表
   */
  static async getPm2List(): Promise<any[]> {
    try {
      const output = execSync('pm2 jlist 2>/dev/null', { encoding: 'utf-8' })
      return JSON.parse(output)
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
}
