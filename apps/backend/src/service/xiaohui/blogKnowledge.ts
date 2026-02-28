/**
 * 博客知识库 — 内存索引
 * 启动时从数据库加载文章/分类/标签元数据，定期自动刷新
 * 所有博客查询从内存读取，响应 < 1ms，无需每次对话查库
 */
import type { DataSource } from 'typeorm'
import { Article } from '@/module/schema/Article'
import { Category } from '@/module/schema/Category'
import { Tag } from '@/module/schema/Tag'
import { CArticleStatus } from '@u-blog/model'

/* ===================== 类型定义 ===================== */

/** 文章元数据（内存索引项） */
export interface ArticleMeta {
  id: number
  title: string
  desc: string | null
  viewCount: number
  likeCount: number
  commentCount: number
  publishedAt: Date | null
  isTop: boolean
  categoryId: number | null
  tagIds: number[]
  /** 小写化 + 去分隔符的搜索文本（标题 + 摘要 + 标签名 + 分类名） */
  _search: string
}

/** 分类元数据 */
export interface CategoryMeta {
  id: number
  name: string
  desc: string | null
}

/** 标签元数据 */
export interface TagMeta {
  id: number
  name: string
  color: string | null
}

/* ===================== 工具函数 ===================== */

/** 自动刷新间隔：5 分钟 */
const REFRESH_INTERVAL = 5 * 60 * 1000

/** 搜索文本规范化：小写 + 去除常见分隔符，便于模糊匹配（vue.js → vuejs） */
function norm(text: string): string {
  return text.toLowerCase().replace(/[.\-_]/g, '')
}

/* ===================== 知识库类 ===================== */

class BlogKnowledgeBase {
  private ds: DataSource | null = null
  private _articles: ArticleMeta[] = []
  private _categories: CategoryMeta[] = []
  private _tags: TagMeta[] = []
  private lastRefresh = 0
  private refreshTimer: ReturnType<typeof setInterval> | null = null
  private loadingPromise: Promise<void> | null = null

  /** 文章数量（用于外部判断是否已加载） */
  get size(): number { return this._articles.length }

  /**
   * 确保知识库就绪（懒初始化 + 定时刷新）
   * 在每次对话开始时调用，缓存有效期内直接返回
   */
  async ensureReady(ds: DataSource): Promise<void> {
    // 已加载且未过期，直接返回
    if (this._articles.length > 0 && Date.now() - this.lastRefresh < REFRESH_INTERVAL) return

    if (!this.ds) this.ds = ds

    // 防止并发重复加载
    if (this.loadingPromise) return this.loadingPromise

    this.loadingPromise = this._load()
    try {
      await this.loadingPromise
    } finally {
      this.loadingPromise = null
    }

    // 启动定时刷新（unref 使其不阻塞进程退出）
    if (!this.refreshTimer) {
      this.refreshTimer = setInterval(() => this._load().catch(console.error), REFRESH_INTERVAL)
      if (this.refreshTimer.unref) this.refreshTimer.unref()
    }
  }

  /** 外部触发全量刷新（文章/分类/标签 CRUD 后可调用） */
  async invalidate(): Promise<void> {
    if (this.ds) await this._load()
  }

  /** 从数据库全量加载（并行查询，通常 50-200ms） */
  private async _load(): Promise<void> {
    if (!this.ds) return

    const [rawArticles, categories, tags] = await Promise.all([
      this.ds.getRepository(Article).find({
        select: ['id', 'title', 'desc', 'viewCount', 'likeCount', 'commentCount', 'publishedAt', 'isTop', 'categoryId'],
        relations: ['tags'],
        where: { status: CArticleStatus.PUBLISHED, isPrivate: false },
      }),
      this.ds.getRepository(Category).find({ select: ['id', 'name', 'desc'] }),
      this.ds.getRepository(Tag).find({ select: ['id', 'name', 'color'] }),
    ])

    // 构建名称映射，用于搜索索引
    const catMap = new Map(categories.map(c => [c.id, c.name]))
    const tagMap = new Map(tags.map(t => [t.id, t.name]))

    this._articles = rawArticles.map(a => {
      const tagIds = (a.tags || []).map((t: any) => t.id)
      const tagNames = tagIds.map((id: number) => tagMap.get(id) || '').join(' ')
      const catName = a.categoryId ? catMap.get(a.categoryId) || '' : ''
      return {
        id: a.id,
        title: a.title,
        desc: a.desc || null,
        viewCount: a.viewCount ?? 0,
        likeCount: a.likeCount ?? 0,
        commentCount: (a as any).commentCount ?? 0,
        publishedAt: a.publishedAt ? new Date(a.publishedAt) : null,
        isTop: !!a.isTop,
        categoryId: a.categoryId ?? null,
        tagIds,
        _search: norm(`${a.title} ${a.desc || ''} ${tagNames} ${catName}`),
      }
    })

    this._categories = categories.map(c => ({ id: c.id, name: c.name, desc: c.desc || null }))
    this._tags = tags.map(t => ({ id: t.id, name: t.name, color: t.color || null }))
    this.lastRefresh = Date.now()

    console.log(`[BlogKB] 已加载 ${this._articles.length} 篇文章 · ${this._categories.length} 个分类 · ${this._tags.length} 个标签`)
  }

  /* =================== 查询方法（全部内存操作，< 1ms） =================== */

  /** 最新文章 */
  getLatestArticles(limit = 8): ArticleMeta[] {
    return [...this._articles]
      .sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0))
      .slice(0, limit)
  }

  /** 热门文章（按浏览量） */
  getHotArticles(limit = 8): ArticleMeta[] {
    return [...this._articles]
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, limit)
  }

  /** 点赞最多 */
  getMostLikedArticles(limit = 8): ArticleMeta[] {
    return [...this._articles]
      .sort((a, b) => b.likeCount - a.likeCount)
      .slice(0, limit)
  }

  /** 分类列表（含文章数） */
  getCategoryList(): { category: CategoryMeta; count: number }[] {
    const countMap = new Map<number, number>()
    for (const a of this._articles) {
      if (a.categoryId != null) countMap.set(a.categoryId, (countMap.get(a.categoryId) || 0) + 1)
    }
    return this._categories.map(c => ({ category: c, count: countMap.get(c.id) || 0 }))
  }

  /** 标签列表（含文章数，按数量降序） */
  getTagList(): { tag: TagMeta; count: number }[] {
    const countMap = new Map<number, number>()
    for (const a of this._articles) {
      for (const tid of a.tagIds) countMap.set(tid, (countMap.get(tid) || 0) + 1)
    }
    return this._tags
      .map(t => ({ tag: t, count: countMap.get(t.id) || 0 }))
      .sort((a, b) => b.count - a.count)
  }

  /** 按分类名查找文章 */
  getArticlesByCategory(name: string, limit = 10): ArticleMeta[] {
    const cat = this._categories.find(c => c.name.toLowerCase() === name.toLowerCase())
    if (!cat) return []
    return this._articles
      .filter(a => a.categoryId === cat.id)
      .sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0))
      .slice(0, limit)
  }

  /** 获取分类信息 */
  findCategory(name: string): CategoryMeta | undefined {
    return this._categories.find(c => c.name.toLowerCase() === name.toLowerCase())
  }

  /** 按标签名查找文章 */
  getArticlesByTag(name: string, limit = 10): ArticleMeta[] {
    const tag = this._tags.find(t => t.name.toLowerCase() === name.toLowerCase())
    if (!tag) return []
    return this._articles
      .filter(a => a.tagIds.includes(tag.id))
      .sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0))
      .slice(0, limit)
  }

  /** 获取标签信息 */
  findTag(name: string): TagMeta | undefined {
    return this._tags.find(t => t.name.toLowerCase() === name.toLowerCase())
  }

  /** 关键词搜索（标题 + 摘要 + 标签 + 分类，标题命中优先） */
  searchArticles(keyword: string, limit = 8): ArticleMeta[] {
    const kw = norm(keyword)
    return this._articles
      .filter(a => a._search.includes(kw))
      .sort((a, b) => {
        // 标题命中优先排序
        const at = norm(a.title).includes(kw) ? 1 : 0
        const bt = norm(b.title).includes(kw) ? 1 : 0
        if (at !== bt) return bt - at
        return (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0)
      })
      .slice(0, limit)
  }

  /** 博客统计概览 */
  getStats() {
    let totalViews = 0, totalLikes = 0, totalComments = 0
    for (const a of this._articles) {
      totalViews += a.viewCount
      totalLikes += a.likeCount
      totalComments += a.commentCount
    }
    return {
      articleCount: this._articles.length,
      categoryCount: this._categories.length,
      tagCount: this._tags.length,
      totalViews,
      totalLikes,
      totalComments,
    }
  }

  /** 推荐文章（置顶 + 热门 + 最新混合去重） */
  getRecommendArticles(limit = 8): ArticleMeta[] {
    const seen = new Set<number>()
    const result: ArticleMeta[] = []
    const add = (list: ArticleMeta[]) => {
      for (const a of list) if (!seen.has(a.id)) { seen.add(a.id); result.push(a) }
    }
    add(this._articles.filter(a => a.isTop).slice(0, 3))
    add(this.getHotArticles(3))
    add(this.getLatestArticles(3))
    return result.slice(0, limit)
  }
}

/** 博客知识库全局单例 */
export const blogKB = new BlogKnowledgeBase()
