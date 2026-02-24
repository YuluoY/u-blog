import crypto from 'node:crypto'
import { type DataSource, Repository } from 'typeorm'
import { Subscriber } from '@/module/schema/Subscriber'
import { Article } from '@/module/schema/Article'
import { createTransporter } from '@/plugin/mailer'

/** 站点 URL，用于拼接邮件中的链接 */
const SITE_URL = () => process.env.SITE_URL || 'http://localhost:5173'

/** 生成唯一的验证/退订令牌 */
const generateToken = () => crypto.randomBytes(48).toString('hex')

/** HTML 转义，防止邮件 XSS */
const escapeHtml = (str: string) =>
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * 订阅服务
 * 提供邮件订阅的核心业务逻辑：订阅、验证、退订、新文章通知
 */
class SubscribeService {
  /**
   * 创建订阅（或重新激活已退订的记录）
   * @returns 新建/复用的 Subscriber 实例
   */
  async subscribe(ds: DataSource, email: string, name?: string | null): Promise<Subscriber> {
    const repo = ds.getRepository(Subscriber)

    // 检查是否已存在
    const existing = await repo.findOne({ where: { email } })

    if (existing) {
      if (existing.status === 'active') {
        throw new Error('该邮箱已订阅')
      }
      // pending 或 unsubscribed → 重新生成令牌，设为 pending
      existing.token = generateToken()
      existing.status = 'pending'
      if (name) existing.name = name
      await repo.save(existing)
      await this.sendVerificationEmail(existing)
      return existing
    }

    // 新订阅
    const subscriber = repo.create({
      email,
      name: name || null,
      token: generateToken(),
      status: 'pending',
    })
    await repo.save(subscriber)
    await this.sendVerificationEmail(subscriber)
    return subscriber
  }

  /**
   * 验证订阅令牌
   */
  async verify(ds: DataSource, token: string): Promise<boolean> {
    const repo = ds.getRepository(Subscriber)
    const subscriber = await repo.findOne({ where: { token } })

    if (!subscriber) return false
    if (subscriber.status === 'active') return true

    subscriber.status = 'active'
    subscriber.token = generateToken() // 验证后刷新令牌（用于后续退订）
    await repo.save(subscriber)
    return true
  }

  /**
   * 退订
   */
  async unsubscribe(ds: DataSource, token: string): Promise<boolean> {
    const repo = ds.getRepository(Subscriber)
    const subscriber = await repo.findOne({ where: { token } })

    if (!subscriber) return false

    subscriber.status = 'unsubscribed'
    subscriber.token = generateToken() // 刷新令牌，防止链接重复使用
    await repo.save(subscriber)
    return true
  }

  /**
   * 发送验证邮件
   */
  private async sendVerificationEmail(subscriber: Subscriber): Promise<void> {
    const verifyUrl = `${SITE_URL()}/api/subscribe/verify?token=${subscriber.token}`
    const safeName = escapeHtml(subscriber.name || '朋友')

    const html = `
      <div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#333;">
        <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:24px 32px;border-radius:8px 8px 0 0;">
          <h2 style="margin:0;color:#fff;font-size:20px;">📬 确认订阅 · 雨落的博客</h2>
        </div>
        <div style="background:#fff;padding:24px 32px;border:1px solid #e8e8e8;border-top:none;border-radius:0 0 8px 8px;">
          <p style="margin:0 0 16px;color:#555;">Hi <strong>${safeName}</strong>，</p>
          <p style="margin:0 0 16px;color:#555;">
            感谢你订阅我的博客！点击下面的按钮确认订阅，之后每当有新文章发布，你都会收到邮件通知。
          </p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${verifyUrl}" style="display:inline-block;background:#667eea;color:#fff;text-decoration:none;padding:12px 32px;border-radius:6px;font-size:16px;font-weight:500;">
              ✅ 确认订阅
            </a>
          </div>
          <p style="margin:0 0 8px;color:#999;font-size:13px;">
            如果按钮无法点击，请复制以下链接到浏览器打开：
          </p>
          <p style="margin:0 0 16px;word-break:break-all;font-size:12px;color:#667eea;">
            ${verifyUrl}
          </p>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0 12px;" />
          <p style="margin:0;font-size:12px;color:#aaa;">
            如果你没有请求此订阅，请忽略此邮件。此链接 24 小时内有效。
          </p>
        </div>
      </div>
    `

    const transporter = createTransporter()
    await transporter.sendMail({
      from: `"雨落的博客" <${process.env.EMAIL_USER}>`,
      to: subscriber.email,
      subject: '📬 确认订阅 · 雨落的博客',
      html,
    })
  }

  /**
   * 新文章发布通知：向所有 active 订阅者发送邮件
   * 设计为异步批量发送，单封失败不影响其他
   */
  async notifyNewArticle(ds: DataSource, article: { id: number; title: string; summary?: string }): Promise<void> {
    const repo = ds.getRepository(Subscriber)
    const subscribers = await repo.find({ where: { status: 'active' } })

    if (subscribers.length === 0) return

    const siteUrl = SITE_URL()
    const articleUrl = `${siteUrl}/read/${article.id}`
    const safeTitle = escapeHtml(article.title)
    const safeSummary = escapeHtml(article.summary || '')

    const transporter = createTransporter()

    // 逐封发送（避免被识别为群发垃圾邮件）
    for (const sub of subscribers) {
      const unsubscribeUrl = `${siteUrl}/api/subscribe/unsubscribe?token=${sub.token}`
      const safeName = escapeHtml(sub.name || '朋友')

      const html = `
        <div style="max-width:600px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#333;">
          <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:24px 32px;border-radius:8px 8px 0 0;">
            <h2 style="margin:0;color:#fff;font-size:20px;">📝 新文章发布 · 雨落的博客</h2>
          </div>
          <div style="background:#fff;padding:24px 32px;border:1px solid #e8e8e8;border-top:none;border-radius:0 0 8px 8px;">
            <p style="margin:0 0 16px;color:#555;">Hi <strong>${safeName}</strong>，</p>
            <p style="margin:0 0 12px;color:#555;">
              雨落发布了一篇新文章，快来看看吧！
            </p>
            <div style="background:#f0f7ff;border-left:4px solid #667eea;padding:16px 20px;margin:0 0 20px;border-radius:4px;">
              <h3 style="margin:0 0 8px;color:#333;font-size:18px;">${safeTitle}</h3>
              ${safeSummary ? `<p style="margin:0;color:#666;font-size:14px;line-height:1.6;">${safeSummary}</p>` : ''}
            </div>
            <div style="text-align:center;margin:24px 0;">
              <a href="${articleUrl}" style="display:inline-block;background:#667eea;color:#fff;text-decoration:none;padding:12px 32px;border-radius:6px;font-size:16px;font-weight:500;">
                📖 阅读全文
              </a>
            </div>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0 12px;" />
            <p style="margin:0;font-size:12px;color:#aaa;">
              你收到此邮件是因为你订阅了雨落的博客。
              <a href="${unsubscribeUrl}" style="color:#999;">退订</a>
            </p>
          </div>
        </div>
      `

      try {
        await transporter.sendMail({
          from: `"雨落的博客" <${process.env.EMAIL_USER}>`,
          to: sub.email,
          subject: `📝 新文章：${article.title}`,
          html,
        })
      } catch (err) {
        console.error(`[Subscribe] 通知邮件发送失败 → ${sub.email}:`, err)
      }

      // 简单延时，避免触发 QQ 邮箱频率限制
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  /**
   * 获取订阅者统计
   */
  async getStats(ds: DataSource): Promise<{ total: number; active: number; pending: number }> {
    const repo = ds.getRepository(Subscriber)
    const [active, pending, total] = await Promise.all([
      repo.count({ where: { status: 'active' } }),
      repo.count({ where: { status: 'pending' } }),
      repo.count(),
    ])
    return { total, active, pending }
  }
}

export default new SubscribeService()
