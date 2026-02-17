import type { Request } from 'express'
import { getDataSource } from '@/utils'
import { Article } from '@/module/schema/Article'
import { Category } from '@/module/schema/Category'
import { Tag } from '@/module/schema/Tag'
import { CArticleStatus } from '@u-blog/model'

export interface SiteOverviewData {
  articleCount: number
  categoryCount: number
  tagCount: number
  totalViews: number
  totalLikes: number
  totalComments: number
  runningDays: number
  lastUpdate: string
}

/**
 * 网站概览统计：文章/分类/标签数量、浏览/点赞/评论汇总、运行天数、最后更新
 * 仅统计已发布文章
 */
export async function getSiteOverview(req: Request): Promise<SiteOverviewData> {
  const ds = getDataSource(req)
  const articleRepo = ds.getRepository(Article)
  const categoryRepo = ds.getRepository(Category)
  const tagRepo = ds.getRepository(Tag)

  const [articleCount, categoryCount, tagCount] = await Promise.all([
    articleRepo.count({ where: { status: CArticleStatus.PUBLISHED } }),
    categoryRepo.count(),
    tagRepo.count()
  ])

  const agg = await articleRepo
    .createQueryBuilder('a')
    .select('COALESCE(SUM(a.viewCount), 0)', 'totalViews')
    .addSelect('COALESCE(SUM(a.likeCount), 0)', 'totalLikes')
    .addSelect('COALESCE(SUM(a.commentCount), 0)', 'totalComments')
    .addSelect('MIN(a.createdAt)', 'earliestCreated')
    .addSelect('MAX(a.updatedAt)', 'latestUpdated')
    .where('a.status = :status', { status: CArticleStatus.PUBLISHED })
    .getRawOne<{
      totalViews: string
      totalLikes: string
      totalComments: string
      earliestCreated: Date | null
      latestUpdated: Date | null
    }>()

  const totalViews = Number(agg?.totalViews ?? 0)
  const totalLikes = Number(agg?.totalLikes ?? 0)
  const totalComments = Number(agg?.totalComments ?? 0)
  const earliestCreated = agg?.earliestCreated ? new Date(agg.earliestCreated) : null
  const latestUpdated = agg?.latestUpdated ? new Date(agg.latestUpdated) : null

  const runningDays = earliestCreated
    ? Math.max(1, Math.floor((Date.now() - earliestCreated.getTime()) / 86400000))
    : 0

  let lastUpdate = '--'
  if (latestUpdated) {
    const d = latestUpdated
    lastUpdate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  return {
    articleCount,
    categoryCount,
    tagCount,
    totalViews,
    totalLikes,
    totalComments,
    runningDays,
    lastUpdate
  }
}
