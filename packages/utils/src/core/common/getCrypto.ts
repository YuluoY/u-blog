/**
 * 获取 crypto 对象（浏览器或 Node.js 环境）
 */
export const getCrypto = () => {
	// 浏览器环境
	if (typeof window !== 'undefined' && window.crypto) {
		return window.crypto
	}
	
	// Node.js 环境
	if (typeof require === 'function') {
		try {
			// @ts-ignore
			return require('node:crypto')
		} catch {
			// fallback
			try {
				// @ts-ignore
				return require('crypto')
			} catch {
				throw new Error('无法获取 crypto 对象：浏览器环境需要 window.crypto，Node.js 环境需要 node:crypto 模块')
			}
		}
	}
	
	throw new Error('无法获取 crypto 对象')
}