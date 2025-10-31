import type { RequestHandler } from 'express'
import multer from 'multer'
import appCfg from '@/app'
import fs from 'node:fs'
import type { StorageEngine } from 'multer'

/**
 * 文件上传中间件 - 本地
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
			cb(null, `${Date.now()}-${file.originalname}`)
		}
	})
	return multer({ storage }).single(name)
}
