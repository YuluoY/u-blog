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

