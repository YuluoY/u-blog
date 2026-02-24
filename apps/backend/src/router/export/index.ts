/**
 * 文章导出路由
 * 支持 markdown / html 格式导出，单篇或批量（zip）
 */
import express, { type Router, type Request, type Response } from 'express'
import { requireAuth } from '@/middleware/AuthGuard'
import { requireRole } from '@/middleware/RoleGuard'
import { CUserRole } from '@u-blog/model'
import { getDataSource } from '@/utils'
import { Article } from '@/module/schema/Article'
import { In } from 'typeorm'

const router = express.Router() as Router
const adminOnly = [requireAuth, requireRole(CUserRole.ADMIN)]

/**
 * POST /export/articles — 导出文章
 * Body: { ids: number[], format: 'md' | 'html' }
 * 单篇直接返回文件，多篇返回 JSON 数组（前端处理打包）
 */
router.post('/articles', ...adminOnly, async (req: Request, res: Response) => {
  const { ids, format = 'md' } = req.body || {}

  if (!Array.isArray(ids) || ids.length === 0) {
    res.json({ code: 1, data: null, message: '请选择要导出的文章' })
    return
  }

  if (ids.length > 100) {
    res.json({ code: 1, data: null, message: '单次最多导出 100 篇文章' })
    return
  }

  try {
    const ds = getDataSource(req)
    const repo = ds.getRepository(Article)
    const articles = await repo.find({
      where: { id: In(ids) },
      relations: ['category', 'tags'],
    }) as (Article & { createdAt?: Date })[]

    if (articles.length === 0) {
      res.json({ code: 1, data: null, message: '未找到选中的文章' })
      return
    }

    // 构建导出数据
    const exports = articles.map(article => {
      const date = article.publishedAt || article.createdAt
      const frontMatter = [
        '---',
        `title: "${article.title}"`,
        `date: ${date instanceof Date ? date.toISOString() : (date || '')}`,
        article.category ? `category: "${(article.category as any).name || ''}"` : null,
        article.tags?.length ? `tags: [${(article.tags as any[]).map(t => `"${t.name}"`).join(', ')}]` : null,
        '---',
        '',
      ].filter(Boolean).join('\n')

      let content = article.content || ''

      if (format === 'md') {
        // Markdown 格式：添加 frontmatter
        content = frontMatter + content
      } else if (format === 'html') {
        // HTML 格式：基础 HTML 包装
        content = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${article.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.8; color: #333; }
    h1 { border-bottom: 2px solid #eee; padding-bottom: 12px; }
    pre { background: #f6f8fa; padding: 16px; border-radius: 6px; overflow-x: auto; }
    code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-size: 0.9em; }
    pre code { background: none; padding: 0; }
    img { max-width: 100%; height: auto; }
    blockquote { border-left: 4px solid #ddd; margin: 0; padding: 0 16px; color: #666; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    th { background: #f6f8fa; }
  </style>
</head>
<body>
  <h1>${article.title}</h1>
  <div class="content">${article.content || ''}</div>
</body>
</html>`
      }

      // 文件名安全处理
      const safeName = article.title
        .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
        .replace(/\s+/g, '_')
        .slice(0, 100)

      const ext = format === 'html' ? '.html' : '.md'

      return {
        id: article.id,
        title: article.title,
        fileName: `${safeName}${ext}`,
        content,
      }
    })

    // 统一返回 JSON 数组，前端负责文件下载 / zip 打包
    res.json({
      code: 0,
      data: exports,
      message: `成功导出 ${exports.length} 篇文章`,
    })
  } catch (err: any) {
    console.error('[export] 导出文章失败:', err)
    res.json({ code: 1, data: null, message: err.message || '导出失败' })
  }
})

export default router
