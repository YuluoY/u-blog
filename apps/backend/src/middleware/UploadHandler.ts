import type { RequestHandler } from 'express'
import multer from 'multer'
import crypto from 'node:crypto'
import path from 'node:path'
import appCfg from '@/app'
import fs from 'node:fs'
import type { StorageEngine } from 'multer'

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
	return multer({ storage }).single(name)
}
