import express, { type Router, type Request, type Response } from 'express'
import { getDataSource, getClientIp, resolveIpLocation } from '@/utils'
import { Article } from '@/module/schema/Article'
import { ActivityLog } from '@/module/schema/ActivityLog'
import { AuthGuard, requireAuth } from '@/middleware/AuthGuard'
import { requireRole } from '@/middleware/RoleGuard'
import { CArticleStatus, CUserRole } from '@u-blog/model'

const router = express.Router() as Router
const adminOnly = requireRole(CUserRole.ADMIN)

const SITE_URL = process.env.SITE_URL || 'https://uluo.cloud'
const sitemapUrl = `${SITE_URL}/sitemap.xml`
const CRAWLER_TRACK_KEY = process.env.CRAWLER_TRACK_KEY || ''

function detectBotName(ua: string | undefined): string {
	const s = (ua || '').toLowerCase()
	if (s.includes('baiduspider')) return 'Baiduspider'
	if (s.includes('googlebot')) return 'Googlebot'
	if (s.includes('bingbot') || s.includes('msnbot')) return 'Bingbot'
	if (s.includes('360spider') || s.includes('haosouspider') || s.includes('qihoobot')) return '360Spider'
	if (s.includes('sogou')) return 'Sogou'
	if (s.includes('yisouspider')) return 'YisouSpider'
	if (s.includes('bytespider') || s.includes('toutiaospider')) return 'Bytespider'
	if (s.includes('yandex')) return 'YandexBot'
	if (s.includes('duckduckbot')) return 'DuckDuckBot'
	if (s.includes('applebot')) return 'Applebot'
	if (s.includes('facebookexternalhit')) return 'FacebookBot'
	if (s.includes('twitterbot')) return 'Twitterbot'
	if (s.includes('linkedinbot')) return 'LinkedInBot'
	if (s.includes('telegrambot')) return 'TelegramBot'
	if (s.includes('whatsapp')) return 'WhatsAppBot'
	if (s.includes('petalbot')) return 'PetalBot'
	if (s.includes('semrushbot')) return 'SemrushBot'
	if (s.includes('ahrefsbot')) return 'AhrefsBot'
	if (s.includes('mj12bot')) return 'MJ12bot'
	return 'Crawler'
}

function parsePathFromUrl(url: string | undefined): string | null {
	if (!url) return null
	try {
		return new URL(url).pathname || '/'
	} catch {
		return null
	}
}

function safeJsonParse(raw: string | null | undefined): Record<string, unknown> | null {
	if (!raw) return null
	try {
		return JSON.parse(raw) as Record<string, unknown>
	} catch {
		return null
	}
}

router.post('/crawler/track', AuthGuard, async (req: Request, res: Response) => {
	try {
		const key = (req.headers['x-crawler-track-key'] as string | undefined) || ''
		if (CRAWLER_TRACK_KEY && key !== CRAWLER_TRACK_KEY) {
			res.status(403).json({ code: 403, data: null, message: 'invalid track key' })
			return
		}

		const body = (req.body || {}) as {
			url?: string
			path?: string
			userAgent?: string
			botName?: string
			source?: string
			cacheHit?: boolean
			statusCode?: number
			renderMs?: number
			htmlBytes?: number
			ip?: string
		}

		const ua = body.userAgent || String(req.headers['user-agent'] || '')
		const botName = body.botName || detectBotName(ua)
		const ip = body.ip || getClientIp(req) || null
		const location = ip ? await resolveIpLocation(ip).catch(() => null) : null

		const ds = getDataSource(req)
		const repo = ds.getRepository(ActivityLog)

		const log = repo.create({
			type: 'crawler_visit',
			userId: null,
			sessionId: null,
			ip,
			location,
			browser: botName,
			device: 'Crawler',
			os: null,
			path: body.path || parsePathFromUrl(body.url) || null,
			referer: body.url || null,
			duration: typeof body.renderMs === 'number' ? body.renderMs : null,
			metadata: JSON.stringify({
				url: body.url || null,
				userAgent: ua || null,
				source: body.source || 'prerender',
				cacheHit: !!body.cacheHit,
				statusCode: body.statusCode || 200,
				htmlBytes: body.htmlBytes || 0,
			}),
		})

		await repo.save(log)
		res.json({ code: 0, data: null, message: 'ok' })
	} catch (err: any) {
		console.error('[SEO] crawler track error:', err)
		res.json({ code: 1, data: null, message: err.message || 'track failed' })
	}
})

router.get('/monitor/crawlers/overview', AuthGuard, requireAuth, adminOnly, async (req: Request, res: Response) => {
	try {
		const ds = getDataSource(req)
		const repo = ds.getRepository(ActivityLog)
		const today = new Date()
		today.setHours(0, 0, 0, 0)

		const [totalVisits, todayVisits, uniqueBotsResult, uniquePathsResult, lastVisit, topBots] = await Promise.all([
			repo.count({ where: { type: 'crawler_visit' } }),
			repo.createQueryBuilder('log').where('log.type = :type', { type: 'crawler_visit' }).andWhere('log.createdAt >= :today', { today }).getCount(),
			repo.createQueryBuilder('log').select('COUNT(DISTINCT log.browser)', 'count').where('log.type = :type', { type: 'crawler_visit' }).getRawOne(),
			repo.createQueryBuilder('log').select('COUNT(DISTINCT log.path)', 'count').where('log.type = :type', { type: 'crawler_visit' }).getRawOne(),
			repo.createQueryBuilder('log').where('log.type = :type', { type: 'crawler_visit' }).orderBy('log.createdAt', 'DESC').getOne(),
			repo
				.createQueryBuilder('log')
				.select('log.browser', 'bot')
				.addSelect('COUNT(*)', 'count')
				.where('log.type = :type', { type: 'crawler_visit' })
				.groupBy('log.browser')
				.orderBy('count', 'DESC')
				.limit(10)
				.getRawMany(),
		])

		res.json({
			code: 0,
			data: {
				totalVisits,
				todayVisits,
				uniqueBots: parseInt(uniqueBotsResult?.count || '0', 10),
				uniquePaths: parseInt(uniquePathsResult?.count || '0', 10),
				lastVisitAt: (lastVisit as any)?.createdAt || null,
				topBots: topBots.map((b: any) => ({ bot: b.bot || 'Crawler', count: parseInt(b.count || '0', 10) })),
			},
			message: 'success',
		})
	} catch (err: any) {
		console.error('[SEO] crawler overview error:', err)
		res.json({ code: 1, data: null, message: err.message || '查询失败' })
	}
})

router.get('/monitor/crawlers/logs', AuthGuard, requireAuth, adminOnly, async (req: Request, res: Response) => {
	try {
		const ds = getDataSource(req)
		const repo = ds.getRepository(ActivityLog)
		const page = Math.max(1, parseInt(req.query.page as string) || 1)
		const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20))
		const bot = (req.query.bot as string) || ''
		const path = (req.query.path as string) || ''

		const qb = repo.createQueryBuilder('log').where('log.type = :type', { type: 'crawler_visit' })

		if (bot) qb.andWhere('log.browser = :bot', { bot })
		if (path) qb.andWhere('log.path LIKE :path', { path: `%${path}%` })

		const [rows, total] = await qb
			.orderBy('log.createdAt', 'DESC')
			.skip((page - 1) * pageSize)
			.take(pageSize)
			.getManyAndCount()

		const list = rows.map((row) => {
			const metadata = safeJsonParse(row.metadata)
			return {
				id: row.id,
				bot: row.browser || 'Crawler',
				ip: row.ip,
				location: row.location,
				path: row.path,
				url: (metadata?.url as string) || row.referer || null,
				cacheHit: Boolean(metadata?.cacheHit),
				statusCode: (metadata?.statusCode as number) || null,
				renderMs: typeof row.duration === 'number' ? row.duration : ((metadata?.renderMs as number) || null),
				htmlBytes: (metadata?.htmlBytes as number) || null,
				userAgent: (metadata?.userAgent as string) || null,
				createdAt: (row as any).createdAt,
			}
		})

		res.json({
			code: 0,
			data: { list, total, page, pageSize },
			message: 'success',
		})
	} catch (err: any) {
		console.error('[SEO] crawler logs error:', err)
		res.json({ code: 1, data: null, message: err.message || '查询失败' })
	}
})

router.get('/sitemap.xml', async (req: Request, res: Response) => {
	try {
		const ds = getDataSource(req)

		const articles = await ds.getRepository(Article)
			.createQueryBuilder('article')
			.select(['article.id', 'article.title', 'article.updatedAt', 'article.publishedAt', 'article.cover'])
			.where('article.status = :status', { status: CArticleStatus.PUBLISHED })
			.andWhere('article.isPrivate = :isPrivate', { isPrivate: false })
			.orderBy('article.publishedAt', 'DESC')
			.getMany()

		const now = new Date().toISOString()

		let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${SITE_URL}/home</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/archive</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${SITE_URL}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${SITE_URL}/message</loc>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${SITE_URL}/links</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
`

		for (const article of articles) {
			const updatedAt = (article as any).updatedAt as Date | undefined
			const lastmod = updatedAt
				? new Date(updatedAt).toISOString()
				: new Date(article.publishedAt).toISOString()

			xml += `  <url>
    <loc>${SITE_URL}/read/${article.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>`

			if (article.cover) {
				const coverUrl = article.cover.startsWith('http') ? article.cover : `${SITE_URL}${article.cover}`
				xml += `
    <image:image>
      <image:loc>${escapeXml(coverUrl)}</image:loc>
      <image:title>${escapeXml(article.title)}</image:title>
    </image:image>`
			}

			xml += `
  </url>
`
		}

		xml += '</urlset>'

		res.set('Content-Type', 'application/xml; charset=utf-8')
		res.set('Cache-Control', 'public, max-age=3600, s-maxage=3600')
		res.send(xml)
	} catch (err) {
		console.error('[SEO] sitemap.xml 生成失败:', err)
		res.status(500).send('Internal Server Error')
	}
})

router.get('/robots.txt', (_req: Request, res: Response) => {
	const disallowPaths = ['/login', '/write', '/write/success', '/chat', '/xiaohui', '/api/', '/admin/']
	const disallowBlock = disallowPaths.map(p => `Disallow: ${p}`).join('\n')

	const engines = [
		{ ua: 'Baiduspider', delay: 1 },
		{ ua: 'Sogou web spider', delay: 1 },
		{ ua: '360Spider', delay: 1 },
		{ ua: 'YisouSpider', delay: 1 },
		{ ua: 'Bytespider', delay: 1 },
		{ ua: 'Googlebot', delay: 0 },
		{ ua: 'bingbot', delay: 0 },
		{ ua: 'Yandex', delay: 1 },
	]

	let txt = `# U-Blog robots.txt\n# Generated: ${new Date().toISOString()}\n\n`

	for (const e of engines) {
		txt += `User-agent: ${e.ua}\nAllow: /\n${disallowBlock}\n`
		if (e.delay > 0) txt += `Crawl-delay: ${e.delay}\n`
		txt += `Sitemap: ${sitemapUrl}\n\n`
	}

	txt += `User-agent: *\nAllow: /\n${disallowBlock}\nSitemap: ${sitemapUrl}\n`

	res.set('Content-Type', 'text/plain; charset=utf-8')
	res.set('Cache-Control', 'public, max-age=86400')
	res.send(txt)
})

router.get('/article/:id/meta', async (req: Request, res: Response) => {
	try {
		const id = parseInt(req.params.id, 10)
		if (isNaN(id)) {
			res.json({ code: 1, data: null, message: '无效的文章ID' })
			return
		}

		const ds = getDataSource(req)
		const article = await ds.getRepository(Article)
			.createQueryBuilder('article')
			.leftJoinAndSelect('article.category', 'category')
			.leftJoinAndSelect('article.tags', 'tag')
			.leftJoinAndSelect('article.user', 'user')
			.select([
				'article.id', 'article.title', 'article.desc',
				'article.cover', 'article.publishedAt',
				'article.viewCount', 'article.likeCount', 'article.commentCount',
				'article.isPrivate', 'article.status',
				'category.id', 'category.name',
				'tag.id', 'tag.name',
				'user.id', 'user.username', 'user.namec',
			])
			.where('article.id = :id', { id })
			.andWhere('article.status = :status', { status: CArticleStatus.PUBLISHED })
			.andWhere('article.isPrivate = :isPrivate', { isPrivate: false })
			.getOne()

		if (!article) {
			res.json({ code: 1, data: null, message: '文章不存在或不可公开访问' })
			return
		}

		const authorName = article.user?.namec || article.user?.username || ''
		const keywords = [
			article.category?.name,
			...(article.tags?.map(t => t.name) || []),
		].filter(Boolean).join(',')

		res.json({
			code: 0,
			data: {
				title: article.title,
				description: article.desc || `${article.title} - ${authorName}`,
				keywords,
				author: authorName,
				cover: article.cover,
				publishedAt: article.publishedAt,
				updatedAt: (article as any).updatedAt,
				category: article.category?.name,
				tags: article.tags?.map(t => t.name) || [],
				viewCount: article.viewCount,
				likeCount: article.likeCount,
				commentCount: article.commentCount,
			},
			message: 'success',
		})
	} catch (err) {
		console.error('[SEO] article meta 查询失败:', err)
		res.json({ code: 1, data: null, message: '查询失败' })
	}
})

function escapeXml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;')
}

export default router