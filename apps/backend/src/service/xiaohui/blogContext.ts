import type { Request } from 'express'
import { getDataSource, getClientIp } from '@/utils'
import { resolveIpLocation } from '@/utils/ipGeo'
import { getWeather, formatWeather } from '@/service/weather'
import { blogKB, type ArticleMeta } from './blogKnowledge'

/* ===================== 博客意图检测 ===================== */

/** 博客查询意图类型 */
export type BlogIntent =
  | { type: 'latest_articles' }
  | { type: 'hot_articles' }
  | { type: 'liked_articles' }
  | { type: 'categories' }
  | { type: 'tags' }
  | { type: 'search'; keyword: string }
  | { type: 'category_articles'; category: string }
  | { type: 'tag_articles'; tag: string }
  | { type: 'blog_stats' }
  | { type: 'recommend' }
  | { type: 'weather' }
  | { type: 'set_theme'; value: string }
  | { type: 'set_language'; value: string }
  | { type: 'set_list_style'; value: string }
  | { type: 'set_visual_style'; value: string }
  | null

/**
 * 检测用户消息中的博客相关意图（正则匹配，零开销）
 * @returns 意图对象，无意图返回 null
 */
export function detectBlogIntent(message: string): BlogIntent {
  const msg = message.trim()

  // ---- 设置类意图 ----
  // 主题切换
  if (/(?:切换|换成?|设置?|改为?|用|变|开启).{0,4}(?:暗[色黑]|深色|dark|夜间)\s*(?:模式|主题)?/i.test(msg))
    return { type: 'set_theme', value: 'dark' }
  if (/(?:切换|换成?|设置?|改为?|用|变|开启).{0,4}(?:亮[色白]|浅色|light|日间|白天)\s*(?:模式|主题)?/i.test(msg))
    return { type: 'set_theme', value: 'default' }
  if (/(?:切换|换|变).{0,4}(?:主题|theme)/i.test(msg))
    return { type: 'set_theme', value: 'toggle' }

  // 语言切换
  if (/(?:切换|换成?|设置?|改为?|用).{0,4}(?:英文|英语|english)/i.test(msg))
    return { type: 'set_language', value: 'en' }
  if (/(?:切换|换成?|设置?|改为?|用).{0,4}(?:中文|中国|chinese)/i.test(msg))
    return { type: 'set_language', value: 'zh' }

  // 列表样式切换
  if (/(?:切换|换成?|设置?|改为?|用).{0,4}(?:卡片|card)\s*(?:视图|模式|列表)?/i.test(msg))
    return { type: 'set_list_style', value: 'card' }
  if (/(?:切换|换成?|设置?|改为?|用).{0,4}(?:瀑布流|waterfall)\s*(?:视图|模式|列表)?/i.test(msg))
    return { type: 'set_list_style', value: 'waterfall' }
  if (/(?:切换|换成?|设置?|改为?|用).{0,4}(?:紧凑|compact)\s*(?:视图|模式|列表)?/i.test(msg))
    return { type: 'set_list_style', value: 'compact' }
  if (/(?:切换|换成?|设置?|改为?|用).{0,4}(?:列表|基础|base|默认)\s*(?:视图|模式)?/i.test(msg))
    return { type: 'set_list_style', value: 'base' }

  // 视觉风格切换
  if (/(?:切换|换成?|设置?|改为?|用|开启).{0,4}(?:毛玻璃|玻璃|glass)\s*(?:风格|效果|模式)?/i.test(msg))
    return { type: 'set_visual_style', value: 'glass' }
  if (/(?:关闭|取消|去掉).{0,4}(?:毛玻璃|玻璃|glass)\s*(?:风格|效果|模式)?/i.test(msg))
    return { type: 'set_visual_style', value: 'default' }

  // ---- 天气意图（仅在用户明确询问天气时触发） ----
  if (/(?:天气|温度|气温|几度|下[雨雪]了?吗?|刮风|穿什么|穿.{0,2}衣服|今天.{0,4}(?:冷|热|暖)|明天.{0,4}(?:冷|热|暖)|weather|temperature)/i.test(msg))
    return { type: 'weather' }

  // ---- 博客数据类意图 ----
  // 最新文章
  if (/(?:最新|最近|近期|新发布|刚发的?).{0,4}(?:文章|博[客文]|帖子|post)/i.test(msg))
    return { type: 'latest_articles' }

  // 热门文章
  if (/(?:热门|最热|最火|浏览最多|阅读最多|最受欢迎|高浏览|高访问|高人气).{0,4}(?:文章|博[客文]|帖子|post)?/i.test(msg))
    return { type: 'hot_articles' }

  // 最多点赞
  if (/(?:点赞最多|最[多高]赞|最受欢迎|最[多高]喜欢|赞最多).{0,4}(?:文章|博[客文]|帖子)?/i.test(msg))
    return { type: 'liked_articles' }

  // 分类列表
  if (/(?:有哪些?|所有|全部|列出?|看看|查看|博客的?)\s*(?:分类|目录|类别|category|categories)/i.test(msg))
    return { type: 'categories' }

  // 标签列表
  if (/(?:有哪些?|所有|全部|列出?|看看|查看|博客的?)\s*(?:标签|tag|tags)/i.test(msg))
    return { type: 'tags' }

  // 博客统计
  if (/(?:博客|网站|站点).{0,4}(?:统计|数据|概况|概览|总览|overview|stats)/i.test(msg)
    || /(?:有多少|一共有|总共有|总计).{0,4}(?:文章|博[客文]|帖子|分类|标签)/i.test(msg))
    return { type: 'blog_stats' }

  // 文章推荐
  if (/(?:推荐|值得[看读]|有什么好[看读的]?|给我[看推]|随便[看看推推荐]?).{0,4}(?:文章|博[客文]|帖子)?/i.test(msg)
    || /(?:不知道[看读]什么|看什么好|读什么好)/i.test(msg))
    return { type: 'recommend' }

  // 按分类查询：「前端分类的文章」「分类前端的文章」「Vue分类」
  const catMatch = msg.match(/(?:(.{1,15})\s*分类.{0,4}(?:文章|博[客文]|帖子)?|分类\s*(.{1,15}).{0,4}(?:的?文章|的?博[客文]|的?帖子))/i)
  if (catMatch) {
    const category = (catMatch[1] || catMatch[2]).trim()
    if (category && !/^(?:有[哪些]?|所有|全部|列出?|看看|查看)$/.test(category))
      return { type: 'category_articles', category }
  }

  // 按标签查询：「Vue标签的文章」「标签Vue」
  const tagMatch = msg.match(/(?:(.{1,15})\s*标签.{0,4}(?:文章|博[客文]|帖子)?|标签\s*(.{1,15}).{0,4}(?:的?文章|的?博[客文]|的?帖子))/i)
  if (tagMatch) {
    const tag = (tagMatch[1] || tagMatch[2]).trim()
    if (tag && !/^(?:有[哪些]?|所有|全部|列出?|看看|查看)$/.test(tag))
      return { type: 'tag_articles', tag }
  }

  // 「关于XXX的文章」「有关XXX的内容」
  {
    const m = msg.match(/(?:关于|有关)\s*(.{1,20}?)\s*(?:的\s*)?(?:文章|博[客文]|帖子|内容)/i)
    if (m) {
      const kw = m[1].trim()
      if (kw) return { type: 'search', keyword: kw }
    }
  }

  // 自然语言查询：「想看看vue相关的文章」「看看Docker的文章」「想了解一下容器」
  {
    const m = msg.match(
      /(?:想看看?|想看一?下|想了解一?下?|想读一?下?|想学习?|看看|看一?下|了解一?下?|想知道)\s*(?:关于\s*)?(.{1,20}?)(?:相关的?\s*(?:文章|博[客文]|帖子|内容)|的\s*(?:文章|博[客文]|帖子|内容))/i,
    )
    if (m) {
      const kw = m[1].trim()
      if (kw) return { type: 'search', keyword: kw }
    }
  }

  // 命令式搜索：「搜索Vue」「查询docker的文章」「找一下React相关」「有没有xxx相关」
  {
    const m = msg.match(
      /(?:搜索|查询|查找|找一?[下些]?|有没有)\s*[「""]?(.{1,30}?)[「""]?\s*(?:的?\s*(?:文章|博[客文]|帖子|内容)|相关|$)/i,
    )
    if (m) {
      let kw = m[1].trim()
      kw = kw.replace(/^(?:本[站博]|博客|网站|站[点内])?(?:里?的?)?(?:关于|有关)?\s*/, '')
      if (kw) return { type: 'search', keyword: kw }
    }
  }

  return null
}

/* ===================== 格式化工具 ===================== */

/** 格式化文章条目为文本行 */
function formatArticle(a: ArticleMeta) {
  const parts = [`「${a.title}」`]
  if (a.viewCount != null) parts.push(`👁${a.viewCount}`)
  if (a.likeCount != null) parts.push(`❤${a.likeCount}`)
  if (a.publishedAt) {
    parts.push(a.publishedAt.toLocaleDateString('zh-CN'))
  }
  return `- ${parts.join(' | ')} [ID:${a.id}]`
}

/** 格式化文章列表为标题 + 条目 */
function formatArticleList(title: string, articles: ArticleMeta[]): string {
  return articles.length
    ? `${title}：\n${articles.map(formatArticle).join('\n')}`
    : '暂无文章'
}

/* ===================== 上下文构建器 ===================== */

/**
 * 博客上下文构建器
 * 所有博客数据查询从 blogKB 内存索引读取（< 1ms），天气按需查询
 */
export class BlogContextBuilder {

  /**
   * 根据意图构建博客上下文文本
   * @returns 注入到系统提示词中的博客数据文本
   */
  static async buildBlogContext(req: Request, intent: BlogIntent): Promise<string> {
    if (!intent) return ''

    // 确保知识库就绪（首次加载或缓存过期时才真正查 DB）
    const ds = getDataSource(req)
    await blogKB.ensureReady(ds)

    let contextData = ''

    try {
      switch (intent.type) {
        case 'latest_articles':
          contextData = formatArticleList('最新发布的文章', blogKB.getLatestArticles())
          break

        case 'hot_articles':
          contextData = formatArticleList('热门文章（按浏览量）', blogKB.getHotArticles())
          break

        case 'liked_articles':
          contextData = formatArticleList('最受欢迎的文章（按点赞数）', blogKB.getMostLikedArticles())
          break

        case 'categories': {
          const list = blogKB.getCategoryList()
          contextData = list.length
            ? `博客分类列表：\n${list.map(r => `- ${r.category.name}（${r.count} 篇文章）${r.category.desc ? '：' + r.category.desc : ''}`).join('\n')}`
            : '暂无分类'
          break
        }

        case 'tags': {
          const list = blogKB.getTagList()
          contextData = list.length
            ? `博客标签列表：\n${list.map(r => `- ${r.tag.name}（${r.count} 篇文章）`).join('\n')}`
            : '暂无标签'
          break
        }

        case 'search':
          contextData = blogKB.searchArticles(intent.keyword).length
            ? `搜索「${intent.keyword}」找到的文章：\n${blogKB.searchArticles(intent.keyword).map(formatArticle).join('\n')}`
            : `没有找到包含「${intent.keyword}」的文章。`
          break

        case 'category_articles': {
          const cat = blogKB.findCategory(intent.category)
          const articles = blogKB.getArticlesByCategory(intent.category)
          if (!cat) {
            contextData = `未找到名为「${intent.category}」的分类。`
          } else {
            contextData = articles.length
              ? `分类「${intent.category}」下的文章：\n${articles.map(formatArticle).join('\n')}`
              : `分类「${intent.category}」下暂无已发布的文章。`
          }
          break
        }

        case 'tag_articles': {
          const tag = blogKB.findTag(intent.tag)
          const articles = blogKB.getArticlesByTag(intent.tag)
          if (!tag) {
            contextData = `未找到名为「${intent.tag}」的标签。`
          } else {
            contextData = articles.length
              ? `标签「${intent.tag}」下的文章：\n${articles.map(formatArticle).join('\n')}`
              : `标签「${intent.tag}」下暂无已发布的文章。`
          }
          break
        }

        case 'blog_stats': {
          const s = blogKB.getStats()
          contextData = [
            '博客统计概览：',
            `- 已发布文章：${s.articleCount} 篇`,
            `- 分类数量：${s.categoryCount} 个`,
            `- 标签数量：${s.tagCount} 个`,
            `- 总浏览量：${s.totalViews}`,
            `- 总点赞数：${s.totalLikes}`,
            `- 总评论数：${s.totalComments}`,
          ].join('\n')
          break
        }

        case 'recommend':
          contextData = formatArticleList('为你推荐的文章', blogKB.getRecommendArticles())
          break

        // 天气意图：按需查询，不再每次对话都查
        case 'weather': {
          const ip = getClientIp(req)
          const location = await resolveIpLocation(ip)
          if (location && location !== '本地') {
            const city = location.split(',')[0]?.trim()
            if (city) {
              const weather = await getWeather(city)
              if (weather) contextData = `用户所在地天气信息：\n${formatWeather(weather)}`
            }
          }
          if (!contextData) contextData = '无法获取用户所在地的天气信息（可能是本地开发环境或 IP 无法定位）。'
          break
        }

        // 设置类意图：不需要查库，仅在提示词中给出指令让 AI 返回 XCMD
        case 'set_theme':
          contextData = `用户想要切换主题。请在回复末尾插入命令：<!--XCMD:SET_THEME:${intent.value}-->`
          break

        case 'set_language':
          contextData = `用户想要切换语言。请在回复末尾插入命令：<!--XCMD:SET_LANG:${intent.value}-->`
          break

        case 'set_list_style':
          contextData = `用户想要切换文章列表样式。请在回复末尾插入命令：<!--XCMD:SET_LIST_STYLE:${intent.value}-->`
          break

        case 'set_visual_style':
          contextData = `用户想要切换视觉风格。请在回复末尾插入命令：<!--XCMD:SET_VISUAL_STYLE:${intent.value}-->`
          break
      }
    } catch (err) {
      console.error('[blogContext] 查询失败:', err)
      return ''
    }

    if (!contextData) return ''

    // 包装为系统提示词的附加段
    const isSettingIntent = intent.type.startsWith('set_')
    if (isSettingIntent) {
      return `\n\n## 用户设置请求\n${contextData}\n请用友好的语气告知用户已为其切换设置，并在回复的**最末尾**附上上述 <!--XCMD:...--> 命令（注意命令必须独立一行）。`
    }

    if (intent.type === 'weather') {
      return `\n\n## 天气数据\n${contextData}\n请基于以上天气数据用友好的语气回答用户。`
    }

    return `\n\n## 博客数据（以下数据来自数据库实时查询，请基于这些数据回答用户）\n${contextData}\n\n请基于以上数据用友好的语气回答用户的问题。每篇文章后面的 [ID:数字] 是文章ID，请用 https://uluo.cloud/read/{ID} 格式生成 Markdown 超链接，例如文章ID是5则链接为 [文章标题](https://uluo.cloud/read/5)。`
  }
}
