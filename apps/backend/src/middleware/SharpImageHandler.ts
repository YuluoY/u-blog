import type { Request, Response, NextFunction } from 'express'
import sharp from 'sharp'
import { join } from 'node:path'
import { existsSync } from 'node:fs'

/**
 * 图片处理中间件 - 支持图片压缩、尺寸调整
 * @param req - Express 请求对象
 * @param res - Express 响应对象
 * @param next - 下一个中间件函数
 *
 * @example
 * // 基本用法
 * app.get('/image/:path', SharpImageHandler, (req, res) => {
 *   if (req.image) {
 *     res.set('Content-Type', `image/${req.image.type}`)
 *     res.send(req.image.buffer)
 *   } else {
 *     res.status(404).send('图片不存在')
 *   }
 * })
 *
 * @example
 * // 压缩图片到 80% 质量
 * // GET /image/photo.jpg?q=80
 *
 * @example
 * // 调整图片尺寸为 300x200 像素
 * // GET /image/photo.jpg?w=300&h=200
 *
 * @example
 * // 调整图片为正方形 150x150 像素
 * // GET /image/photo.jpg?s=150
 */
export const SharpImageHandler = async (req: Request, res: Response, next: NextFunction) => {
	const { w, h, s, q } = req.query
	const quality = q ? Number(typeof q === 'string' ? q : Array.isArray(q) ? q[0] : q) : 100
	const width = w ? Number(typeof w === 'string' ? w : Array.isArray(w) ? w[0] : w) : null
	const height = h ? Number(typeof h === 'string' ? h : Array.isArray(h) ? h[0] : h) : null
	const size = s ? Number(typeof s === 'string' ? s : Array.isArray(s) ? s[0] : s) : null

	const finalWidth = size || width
	const finalHeight = size || height

	let imageBuffer = null
	const qExts = ['jpeg', 'png', 'webp', 'gif']

	const localPath = join(__dirname, '../..', 'public/static/image', req.params.path)

	if (!existsSync(localPath)) {
		req.image = null
		return next()
	}

	let image = sharp(localPath)
	const metadata = await image.metadata()

	// 压缩
	if (req.query.q && qExts.includes(metadata.format) && quality > 0 && quality <= 100) {
		if (metadata.format === 'png') {
			image = image.png({ compressionLevel: quality / 100 })
		} else {
			image = image[metadata.format]({ quality })
		}
	}

	// 尺寸
	if (finalWidth && finalHeight) {
		imageBuffer = await image.resize(Number(finalWidth), Number(finalHeight)).toBuffer()
	} else {
		imageBuffer = await image.toBuffer()
	}

	req.image = { buffer: imageBuffer, type: metadata.format }
	if (quality) {
		req.image.quality = quality
	}
	next()
}