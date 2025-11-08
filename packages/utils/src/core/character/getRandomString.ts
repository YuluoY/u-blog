/**
 * @param length 字符串长度
 * @param type 字符串类型：'hex'(16进制) | 'base64'(base64) | 'alphanumeric'(字母数字)
 * @example
 * ```ts
 * getRandomString(32) // '1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p'
 * getRandomString(32, 'hex') // '1234567890abcdef1234567890abcdef'
 * getRandomString(32, 'base64') // 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef'
 * getRandomString(32, 'alphanumeric') // 'aB3dE5gH7jK9mN1pQ3sT5vW7yZ0bC2e'
 * ```
 */
export const getRandomString = (
	length: number = 32, 
	type: 'hex' | 'base64' | 'alphanumeric' = 'hex'
): string => {
	const charSets = {
		hex: '0123456789abcdef',
		base64: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
		alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
	}
	
	const chars = charSets[type]
	let result = ''
	
	// 使用 Math.random() 生成随机字符串
	// 为了增加随机性，结合时间戳作为种子
	const timestamp = Date.now()
	
	for (let i = 0; i < length; i++) {
		// 混合使用 Math.random() 和时间戳来增加随机性
		const seed = Math.random() * timestamp * (i + 1)
		const randomIndex = Math.floor((seed % 1) * chars.length * Math.random())
		result += chars[randomIndex % chars.length]
	}
	
	return result
}