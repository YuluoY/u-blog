import type { RequestHandler } from 'express'
import multer from 'multer'
import crypto from 'node:crypto'
import path from 'node:path'
import appCfg from '@/app'
import fs from 'node:fs'
import type { StorageEngine } from 'multer'

/** 允许上传的 MIME 类型白名单 */
const ALLOWED_MIME_TYPES = new Set([
	'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
	'image/bmp', 'image/x-icon', 'image/avif',
	'application/pdf',
	'video/mp4', 'video/webm',
	'audio/mpeg', 'audio/wav', 'audio/ogg',
])

/** 文件大小上限：10MB */
const MAX_FILE_SIZE = 10 * 1024 * 1024

/**
 * 文件上传中间件 - 本地
 * 文件名采用 时间戳-随机hex.扩展名，避免中文等非 ASCII 字符乱码
 */
export const UploadHandler = (name: string): RequestHandler => {
	const storage: StorageEngine = multer.diskStorage({
		destination: (req, file, cb) => {
			const p = appCfg.staticPath + '/uploads'
			if (!fs.existsSync(p)) {
				fs.mkdirSync(p)
			}
			cb(null, p)
		},
		filename: (req, file, cb) => {
			const ext = path.extname(file.originalname) || '.bin'
			const rand = crypto.randomBytes(8).toString('hex')
			cb(null, `${Date.now()}-${rand}${ext}`)
		}
	})
	return multer({
		storage,
		limits: { fileSize: MAX_FILE_SIZE },
		fileFilter: (_req, file, cb) => {
			if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
				cb(null, true)
			} else {
				cb(new Error(`不支持的文件类型: ${file.mimetype}`))
			}
		},
	}).single(name)
}
