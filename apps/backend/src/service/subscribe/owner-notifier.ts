import { createTransporter } from '@/plugin/mailer'

/** 待通知的订阅记录 */
interface PendingSubscription {
  email: string
  name: string | null
  createdAt: Date
}

/** 默认汇总窗口：1 小时（毫秒） */
const DEFAULT_WINDOW_MS = 60 * 60 * 1000

/**
 * 博主订阅通知器
 * 将一段时间内的新订阅汇总为一封邮件发送给博主，避免逐条骚扰
 *
 * 工作原理：
 * 1. 首条订阅入队时启动定时器
 * 2. 后续订阅仅入队，不重置定时器
 * 3. 定时器到期后，将队列中所有订阅汇总为一封邮件发出
 */
class OwnerNotifier {
  private queue: PendingSubscription[] = []
  private timer: ReturnType<typeof setTimeout> | null = null
  private windowMs: number

  constructor(windowMs = DEFAULT_WINDOW_MS) {
    this.windowMs = windowMs
  }

  /** 新订阅入队 */
  enqueue(email: string, name: string | null): void {
    this.queue.push({ email, name, createdAt: new Date() })

    // 首条订阅启动定时器
    if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.windowMs)
    }
  }

  /** 发送汇总邮件并清空队列 */
  private async flush(): Promise<void> {
    this.timer = null

    if (this.queue.length === 0) return

    const batch = [...this.queue]
    this.queue = []

    const ownerEmail = process.env.OWNER_EMAIL || process.env.EMAIL_USER
    if (!ownerEmail) {
      console.warn('[OwnerNotifier] 未配置 OWNER_EMAIL 或 EMAIL_USER，跳过博主通知')
      return
    }

    try {
      const transporter = createTransporter()
      const rows = batch
        .map(
          (s) =>
            `<tr>
              <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${escapeHtml(s.email)}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${escapeHtml(s.name || '—')}</td>
              <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${formatTime(s.createdAt)}</td>
            </tr>`,
        )
        .join('')

      const html = `
        <div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#333;">
          <div style="background:linear-gradient(135deg,#f093fb 0%,#f5576c 100%);padding:24px 32px;border-radius:8px 8px 0 0;">
            <h2 style="margin:0;color:#fff;font-size:20px;">🔔 新订阅通知 · 雨落的博客</h2>
          </div>
          <div style="background:#fff;padding:24px 32px;border:1px solid #e8e8e8;border-top:none;border-radius:0 0 8px 8px;">
            <p style="margin:0 0 16px;color:#555;">
              过去一段时间内有 <strong>${batch.length}</strong> 位新读者发起了订阅（待验证）：
            </p>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <thead>
                <tr style="background:#f9f9f9;">
                  <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e8e8e8;">邮箱</th>
                  <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e8e8e8;">昵称</th>
                  <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e8e8e8;">时间</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
            <p style="margin:16px 0 0;font-size:13px;color:#999;">
              注：以上读者尚处于"待验证"状态，只有点击验证邮件后才会正式生效。
            </p>
          </div>
        </div>
      `

      await transporter.sendMail({
        from: `"雨落的博客" <${process.env.EMAIL_USER}>`,
        to: ownerEmail,
        subject: `🔔 新增 ${batch.length} 位订阅者 · 雨落的博客`,
        html,
      })

      console.log(`[OwnerNotifier] 已通知博主，本批共 ${batch.length} 条订阅`)
    } catch (err) {
      console.error('[OwnerNotifier] 博主通知邮件发送失败:', err)
      // 发送失败不回填队列，避免无限重试；只记日志
    }
  }
}

/** HTML 转义 */
const escapeHtml = (str: string) =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** 格式化时间为 YYYY-MM-DD HH:mm */
const formatTime = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 单例导出 */
export default new OwnerNotifier()
