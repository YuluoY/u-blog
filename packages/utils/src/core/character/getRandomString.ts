import { getCrypto } from '../common'
/**
 * 获取加密随机字符串
 * @example
 * ```ts
 * getRandomString(32) // '1234567890abcdef1234567890abcdef'
 * getRandomString(32, 'base64') // '1234567890abcdef1234567890abcdef'
 * ```
 */
export const getRandomString = (length: number = 32, encoding: BufferEncoding = 'hex') => {
	const crypto = getCrypto()
	
	// 浏览器环境使用 crypto.getRandomValues
	if (typeof window !== 'undefined' && 'getRandomValues' in crypto) {
		const array = new Uint8Array(Math.ceil(length / 2))
		crypto.getRandomValues(array)
		
		if (encoding === 'hex') {
			return Array.from(array)
				.map(b => b.toString(16).padStart(2, '0'))
				.join('')
				.slice(0, length)
		} else if (encoding === 'base64') {
			// 浏览器环境需要手动转换为 base64
			const binary = Array.from(array).map(b => String.fromCharCode(b)).join('')
			return btoa(binary)
				.replace(/[+/=]/g, '')
				.slice(0, length)
		} else {
			// 其他编码类型，转换为 Buffer 再处理
			const buffer = Buffer.from(array)
			return buffer.toString(encoding).slice(0, length)
		}
	}
	
	// Node.js 环境使用 crypto.randomBytes
	if (typeof crypto.randomBytes === 'function') {
		return crypto
			.randomBytes(Math.ceil(length / 2))
			.toString(encoding)
			.slice(0, length)
	}
	
	throw new Error('crypto 对象不支持 randomBytes 或 getRandomValues')
}