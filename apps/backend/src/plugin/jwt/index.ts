import jwt from 'jsonwebtoken'
import appCfg from '@/app'
/**
 * Sign token
 * @param   {import('express').Request} req
 * @param   {object} payload
 * @returns {string}
 */
export const sign = (req, payload) => {
	return jwt.sign(payload, process.env.JWT_SECRET, appCfg.plugins.jwt)
}

/**
 * Verify token
 * @param   {string} token
 * @param {string | undefined} [secret=process.env.JWT_SECRET]
 * @returns {{valid: boolean, data?: object, error?: string}}
 */
export const verify = (token, secret = process.env.JWT_SECRET) => {
	try {
		const decoded = jwt.verify(token, secret)
		return { valid: true, data: decoded }
	} catch (error) {
		return { valid: false, error: error.message }
	}
}

export const signRt = (req, payload, secret) => {
	return jwt.sign(payload, secret, appCfg.plugins.rt)
}

export const decode = (token) => {
	return jwt.decode(token)
}
