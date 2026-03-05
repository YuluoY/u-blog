import { Router, type Request, type Response, type IRouter } from 'express'
import sharp from 'sharp'
import { resolve, join, extname } from 'node:path'
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import appCfg from '@/app'

const router: IRouter = Router()

/** 缓存目录 */
const CACHE_DIR = resolve(appCfg.staticPath, '../tmp-deploy/image-cache')
if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true })

/** 允许的输出格式 */
const ALLOWED_FORMATS = new Set(['webp', 'avif', 'jpeg', 'png'])

/** 宽度上限，防止恶意请求 */
const MAX_WIDTH = 1920

/** 默认 JPEG/WebP 质量 */
const DEFAULT_QUALITY = 80

/**
 * GET /uploads-opt/<path>?w=&q=&fmt=
 *
 * 参数：
 *   w   — 目标宽度（保持比例缩放），默认不缩放
 *   q   — 压缩质量 1-100，默认 80
 *   fmt — 输出格式：webp | avif | jpeg | png，默认 webp
 *
 * 处理逻辑：
 *   1. 检查文件系统缓存，命中则直接返回
 *   2. 未命中则用 sharp 实时转换并写入缓存
 *   3. 响应带 1 年缓存头（文件名含 content hash 可放心缓存）
 */
router.get('/*', async (req: Request, res: Response) => {
	try {
		// 解析原图路径
		const relativePath = req.params[0]
		if (!relativePath) {
			res.status(400).json({ code: 400, message: '缺少图片路径' })
			return
		}

		const uploadsDir = resolve(appCfg.staticPath, 'uploads')
		const originalPath = resolve(uploadsDir, relativePath)

		// 路径穿越防护
		if (!originalPath.startsWith(uploadsDir)) {
			res.status(403).json({ code: 403, message: '非法路径' })
			return
		}

		if (!existsSync(originalPath)) {
			res.status(404).json({ code: 404, message: '图片不存在' })
			return
		}

		// 解析参数
		const width = req.query.w ? Math.min(Number(req.query.w), MAX_WIDTH) : undefined
		const quality = req.query.q ? Math.min(Math.max(Number(req.query.q), 1), 100) : DEFAULT_QUALITY
		const fmt = ALLOWED_FORMATS.has(req.query.fmt as string) ? (req.query.fmt as string) : 'webp'

		// 生成缓存 key: <原文件名>__w<width>_q<quality>.<fmt>
		const baseName = relativePath.replace(/[/\\]/g, '_').replace(extname(relativePath), '')
		const cacheKey = `${baseName}__w${width || 'auto'}_q${quality}.${fmt}`
		const cachePath = join(CACHE_DIR, cacheKey)

		// 缓存命中：检查缓存文件是否比原图更新
		if (existsSync(cachePath)) {
			const origMtime = statSync(originalPath).mtimeMs
			const cacheMtime = statSync(cachePath).mtimeMs
			if (cacheMtime >= origMtime) {
				const cached = readFileSync(cachePath)
				res.set({
					'Content-Type': `image/${fmt}`,
					'Cache-Control': 'public, max-age=31536000, immutable',
					'Vary': 'Accept',
				})
				res.send(cached)
				return
			}
		}

		// sharp 处理
		let pipeline = sharp(originalPath)

		if (width) {
			pipeline = pipeline.resize({ width, withoutEnlargement: true })
		}

		switch (fmt) {
			case 'webp':
				pipeline = pipeline.webp({ quality })
				break
			case 'avif':
				pipeline = pipeline.avif({ quality })
				break
			case 'jpeg':
				pipeline = pipeline.jpeg({ quality, mozjpeg: true })
				break
			case 'png':
				pipeline = pipeline.png({ compressionLevel: Math.round((100 - quality) / 10) })
				break
		}

		const buffer = await pipeline.toBuffer()

		// 异步写入缓存（不阻塞响应）
		writeFileSync(cachePath, buffer)

		res.set({
			'Content-Type': `image/${fmt}`,
			'Cache-Control': 'public, max-age=31536000, immutable',
			'Vary': 'Accept',
		})
		res.send(buffer)
	} catch (err) {
		console.error('[uploads-opt] 图片处理失败:', err)
		res.status(500).json({ code: 500, message: '图片处理失败' })
	}
})

export default router
