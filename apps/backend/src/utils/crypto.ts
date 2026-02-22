import crypto from 'crypto'

// 加密算法
const ALGORITHM = 'aes-256-cbc'
// IV 长度
const IV_LENGTH = 16

/**
 * 获取加密密钥（从环境变量）
 */
const getEncryptionKey = (): Buffer => {
	const key = process.env.ENCRYPTION_KEY
	if (!key) {
		throw new Error('ENCRYPTION_KEY 未在环境变量中设置')
	}
	// 确保密钥长度为 32 字节（256 位）
	return crypto.createHash('sha256').update(key).digest()
}

/**
 * AES 加密
 * @param text 要加密的文本
 * @returns 加密后的字符串（格式：iv:encryptedData）
 */
export const encrypt = (text: string): string => {
	const key = getEncryptionKey()
	const iv = crypto.randomBytes(IV_LENGTH)
	const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
	
	let encrypted = cipher.update(text, 'utf8', 'hex')
	encrypted += cipher.final('hex')
	
	// 返回格式：iv:encryptedData
	return `${iv.toString('hex')}:${encrypted}`
}

/**
 * AES 解密
 * @param encryptedText 加密的文本（格式：iv:encryptedData）
 * @returns 解密后的原始文本
 */
export const decrypt = (encryptedText: string): string => {
	const key = getEncryptionKey()
	const parts = encryptedText.split(':')
	
	if (parts.length !== 2) {
		throw new Error('加密数据格式错误')
	}
	
	const iv = Buffer.from(parts[0], 'hex')
	const encryptedData = parts[1]
	
	const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
	let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
	decrypted += decipher.final('utf8')
	
	return decrypted
}

/* ========== 传输层解密（与前端 transportCrypto.ts 配对） ========== */

/** 与前端共享的传输密钥种子（通过 SHA-256 派生 256-bit 密钥） */
const TRANSPORT_SEED = 'u-blog-transport-key-2024!!@#$%'

/** 从种子派生 AES-256 密钥 */
function getTransportKey(): Buffer {
	return crypto.createHash('sha256').update(TRANSPORT_SEED).digest()
}

/**
 * 解密前端传输层加密的文本
 * 格式: `__enc__:<base64 iv>:<base64 ciphertext+authTag>`
 * 非传输加密格式则原样返回
 */
export function decryptTransport(text: string): string {
	if (!text.startsWith('__enc__:')) return text
	const parts = text.split(':')
	// 期望 ['__enc__', base64Iv, base64Ciphertext]
	if (parts.length !== 3) return text

	try {
		const iv = Buffer.from(parts[1], 'base64')
		const data = Buffer.from(parts[2], 'base64')
		const key = getTransportKey()

		// AES-GCM: 密文末尾 16 字节是 authTag
		const AUTH_TAG_LEN = 16
		const ciphertext = data.subarray(0, data.length - AUTH_TAG_LEN)
		const authTag = data.subarray(data.length - AUTH_TAG_LEN)

		const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
		decipher.setAuthTag(authTag)
		let decrypted = decipher.update(ciphertext, undefined, 'utf8')
		decrypted += decipher.final('utf8')
		return decrypted
	} catch {
		// 解密失败则原样返回（兼容非加密旧数据）
		return text
	}
}

