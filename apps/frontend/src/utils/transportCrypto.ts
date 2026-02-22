/**
 * 传输层加密 — 防止敏感数据（如 API Key）在 HTTP 请求中以明文出现
 *
 * 使用 AES-256-GCM（Web Crypto API）+ SHA-256 派生共享密钥
 * 加密后格式: `__enc__:<base64 iv>:<base64 ciphertext+authTag>`
 * 后端 `decryptTransport()` 使用相同密钥解密
 */

/** 与后端共享的传输密钥种子（通过 SHA-256 派生 256-bit 密钥） */
const TRANSPORT_SEED = 'u-blog-transport-key-2024!!@#$%'

/** 将 ArrayBuffer / TypedArray 转为 base64 字符串 */
function bufToBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  return btoa(String.fromCharCode(...bytes))
}

/** 从共享种子派生 AES-256 CryptoKey */
async function deriveKey(): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const rawKey = await crypto.subtle.digest('SHA-256', enc.encode(TRANSPORT_SEED))
  return crypto.subtle.importKey('raw', rawKey, { name: 'AES-GCM' }, false, ['encrypt'])
}

/**
 * 加密敏感文本用于网络传输
 * @param plaintext 明文
 * @returns `__enc__:<iv>:<ciphertext>` 格式的密文字符串
 */
export async function encryptForTransport(plaintext: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await deriveKey()
  const iv = crypto.getRandomValues(new Uint8Array(12)) // 96-bit IV for AES-GCM
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext),
  )
  return `__enc__:${bufToBase64(iv)}:${bufToBase64(ciphertext)}`
}
