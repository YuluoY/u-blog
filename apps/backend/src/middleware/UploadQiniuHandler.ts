import type { RequestHandler } from "express"

/**
 * 文件上传中间件 - 七牛云
 */
export const UploadQiniuHandler: RequestHandler = (req, res, next) => {
	next()
}

