import type { Request } from 'express'

/**
 * 从请求中提取客户端真实 IP
 * 优先级：CF-Connecting-IP > X-Real-IP > X-Forwarded-For > req.ip > socket
 */
export function getClientIp(req: Request): string | undefined {
  // Cloudflare 直接传递真实 IP
  const cfIp = req.headers['cf-connecting-ip']
  if (typeof cfIp === 'string' && cfIp) return cfIp.trim()

  // Nginx proxy_set_header X-Real-IP
  const realIp = req.headers['x-real-ip']
  if (typeof realIp === 'string' && realIp) return realIp.trim()

  // X-Forwarded-For（取第一个，即最初客户端）
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded) return forwarded.split(',')[0]?.trim()
  if (Array.isArray(forwarded) && forwarded[0]) return String(forwarded[0]).split(',')[0]?.trim()

  // Express req.ip（设置 trust proxy 后会解析代理头）
  if (req.ip && !isLoopback(req.ip)) return req.ip

  return req.socket?.remoteAddress as string | undefined
}

/** 判断是否为回环地址 */
function isLoopback(ip: string): boolean {
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1'
}
