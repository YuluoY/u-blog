import jwt from 'jsonwebtoken'
import appCfg from '@/app'
import type { Request } from 'express'
/**
 * Sign token
 * @param    req
 * @param    payload
 */
export const sign = <T extends string | object | Buffer>(req: Request, payload: T) => {
	return jwt.sign(payload, process.env.JWT_SECRET, appCfg.plugins.jwt)
}

/**
 * Verify token
 * @param    token
 * @param    secret
 */
export const verify = <T = any>(token: string, secret = process.env.JWT_SECRET) => {
	try {
		const decoded = jwt.verify(token, secret)
		return { valid: true, data: decoded as T }
	} catch (error) {
		return { valid: false, error: error.message }
	}
}


export const signRt = <T extends string | object | Buffer>(req: Request, payload: T, secret: string) => {
	return jwt.sign(payload, secret, appCfg.plugins.rt)
}

export const decode = <T = any>(token: string) => {
	return jwt.decode(token) as T
}
