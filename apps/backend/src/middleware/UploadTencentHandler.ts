import type { RequestHandler } from "express"

/**
 * 文件上传中间件 - 腾讯云
 */
export const UploadTencentHandler: RequestHandler = (req, res, next) => {
	next()
}

