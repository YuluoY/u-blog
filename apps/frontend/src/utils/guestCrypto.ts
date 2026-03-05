/**
 * 游客本地 AI 配置加密存储
 * ──────────────────────────────────────────────
 * 使用 Web Crypto API (PBKDF2 + AES-256-GCM)
 * 将游客自行输入的 API Key 等敏感信息加密存储到 localStorage。
 *
 * 安全策略：
 * - 密钥通过 PBKDF2 从固定种子 + 浏览器指纹派生（不可逆）
 * - 每次加密使用随机 IV（12 bytes）
 * - AES-256-GCM 提供认证加密（防篡改）
 * - 加密数据格式: base64(iv) + '.' + base64(ciphertext+authTag)
 */

/** localStorage 存储 key */
const GUEST_AI_CONFIG_KEY = 'u-blog:guest-ai-config'

/** PBKDF2 派生种子（公开但结合浏览器指纹后不可跨设备复用） */
const DERIVE_SALT = 'u-blog-guest-ai-2024'

/** 获取浏览器指纹作为 PBKDF2 的 password */
function getBrowserSeed(): string
{
  const parts = [
    navigator.userAgent,
    navigator.language,
    screen.width.toString(),
    screen.height.toString(),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ]
  return parts.join('|')
}

/** ArrayBuffer → base64（逐字节拼接，避免 spread 超限） */
function bufToBase64(buf: ArrayBuffer | Uint8Array): string
{
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary)
}

/** base64 → Uint8Array */
function base64ToBuf(b64: string): Uint8Array
{
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

/** 从浏览器指纹 + 固定盐派生 AES-256-GCM CryptoKey */
async function deriveKey(): Promise<CryptoKey>
{
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(getBrowserSeed()),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(DERIVE_SALT),
      iterations: 100_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

/** 加密明文 → 密文字符串 */
async function encrypt(plaintext: string): Promise<string>
{
  const enc = new TextEncoder()
  const key = await deriveKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext),
  )
  return `${bufToBase64(iv)}.${bufToBase64(ciphertext)}`
}

/** 密文字符串 → 明文 */
async function decrypt(encrypted: string): Promise<string>
{
  const [ivB64, dataB64] = encrypted.split('.')
  if (!ivB64 || !dataB64) throw new Error('Invalid encrypted format')

  const key = await deriveKey()
  const iv = base64ToBuf(ivB64)
  const data = base64ToBuf(dataB64)

  const plainBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data,
  )
  return new TextDecoder().decode(plainBuf)
}

/* ========== 对外接口 ========== */

/** 单个厂商的配置条目 */
export interface GuestProviderEntry {
  apiKey: string
  model: string
  /** 仅 custom 厂商需要 */
  baseUrl?: string
}

/** 游客 AI 配置（按厂商独立存储） */
export interface GuestAiConfig {
  /** 当前激活的厂商 key */
  activeProvider: string
  /** 各厂商的独立配置 */
  providers: Record<string, GuestProviderEntry>
}

/**
 * 兼容旧格式迁移：
 * 旧格式 { apiKey, baseUrl, model, provider? }
 * 新格式 { activeProvider, providers: { ... } }
 */
function migrateOldFormat(data: any): GuestAiConfig
{
  // 已经是新格式
  if (data.activeProvider && data.providers) return data as GuestAiConfig
  // 旧格式迁移
  const provider = data.provider || 'custom'
  const entry: GuestProviderEntry = {
    apiKey: data.apiKey || '',
    model: data.model || '',
  }
  if (provider === 'custom' && data.baseUrl)
    entry.baseUrl = data.baseUrl
  return {
    activeProvider: provider,
    providers: { [provider]: entry },
  }
}

/** 保存游客 AI 配置到 localStorage（加密） */
export async function saveGuestAiConfig(config: GuestAiConfig): Promise<void>
{
  const json = JSON.stringify(config)
  const encrypted = await encrypt(json)
  localStorage.setItem(GUEST_AI_CONFIG_KEY, encrypted)
}

/** 读取游客 AI 配置（解密）；兼容旧格式自动迁移；失败则返回 null */
export async function loadGuestAiConfig(): Promise<GuestAiConfig | null>
{
  const raw = localStorage.getItem(GUEST_AI_CONFIG_KEY)
  if (!raw) return null
  try
  {
    const json = await decrypt(raw)
    const parsed = JSON.parse(json)
    return migrateOldFormat(parsed)
  }
  catch
  {
    // 解密失败（浏览器指纹变化等）→ 清除无效数据
    localStorage.removeItem(GUEST_AI_CONFIG_KEY)
    return null
  }
}

/** 清除游客 AI 配置 */
export function clearGuestAiConfig(): void
{
  localStorage.removeItem(GUEST_AI_CONFIG_KEY)
}

/** 检查是否存在游客 AI 配置 */
export function hasGuestAiConfig(): boolean
{
  return !!localStorage.getItem(GUEST_AI_CONFIG_KEY)
}

/** 获取当前激活厂商的有效配置（解密后提取，用于快速判断） */
export function getActiveEntry(config: GuestAiConfig): GuestProviderEntry | null
{
  const entry = config.providers[config.activeProvider]
  return entry?.apiKey ? entry : null
}
