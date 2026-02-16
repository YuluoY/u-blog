import type { Request } from 'express'

/** 从请求中取客户端 IP（考虑 X-Forwarded-For 等代理） */
export function getClientIp(req: Request): string | undefined {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') return forwarded.split(',')[0]?.trim()
  if (Array.isArray(forwarded) && forwarded[0]) return String(forwarded[0]).split(',')[0]?.trim()
  return req.ip ?? (req.socket?.remoteAddress as string | undefined)
}
