import fs from 'node:fs'
import path from 'node:path'
import appCfg from '@/app'

const BASE64_IMAGE_REGEX = /!\[([^\]]*)\]\((data:image\/[^;]+;base64,[^)]+)\)/g
const BASE64_IMAGE_REGEX_ALT = /<img[^>]+src="(data:image\/[^;]+;base64,[^"]+)"[^>]*>/g

const UPLOAD_DIR = 'uploads'

/**
 * 从 markdown 内容中提取 base64 图片，写入静态目录，并替换为相对 URL
 */
export function processArticleContent(content: string): string {
  const uploadDir = path.join(appCfg.staticPath, UPLOAD_DIR)
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }

  let result = content

  const replaceBase64 = (match: string, alt: string, dataUrl: string): string => {
    const m = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/)
    if (!m) return match
    const ext = m[1] === 'jpeg' ? 'jpg' : m[1]
    const base64Data = m[2]
    const buffer = Buffer.from(base64Data, 'base64')
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`
    const filepath = path.join(uploadDir, filename)
    fs.writeFileSync(filepath, buffer)
    const url = `/${UPLOAD_DIR}/${filename}`
    return `![${alt}](${url})`
  }

  result = result.replace(BASE64_IMAGE_REGEX, replaceBase64)
  result = result.replace(BASE64_IMAGE_REGEX_ALT, (match) => {
    const m = match.match(/src="(data:image\/[^;]+;base64,[^"]+)"/)
    if (!m) return match
    const [, dataUrl] = m
    const m2 = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/)
    if (!m2) return match
    const ext = m2[1] === 'jpeg' ? 'jpg' : m2[1]
    const buffer = Buffer.from(m2[2], 'base64')
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`
    const filepath = path.join(uploadDir, filename)
    fs.writeFileSync(filepath, buffer)
    const url = `/${UPLOAD_DIR}/${filename}`
    return match.replace(dataUrl, url)
  })

  return result
}
