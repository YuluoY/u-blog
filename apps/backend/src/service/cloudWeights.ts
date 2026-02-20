import type { Request } from 'express'
import { getDataSource } from '@/utils'
import { Article } from '@/module/schema/Article'
import { Category } from '@/module/schema/Category'
import { Tag } from '@/module/schema/Tag'
import { CArticleStatus } from '@u-blog/model'

export interface CloudItem {
  id: number
  name: string
  /** 权重：使用该分类/标签的已发布文章数 */
  weight: number
  /** 声噪（信噪比）：归一化后的权重 0~1，越大表示越突出 */
  signalNoise: number
}

export interface CloudWeightsData {
  categories: (CloudItem & { desc?: string | null })[]
  tags: (CloudItem & { color?: string | null })[]
}

/**
 * 分析类别与标签的权重（文章数）与声噪（归一化权重），供前端词云等可视化使用
 * 仅统计已发布文章
 */
export async function getCloudWeights(req: Request): Promise<CloudWeightsData> {
  const ds = getDataSource(req)
  const articleRepo = ds.getRepository(Article)
  const categoryRepo = ds.getRepository(Category)
  const tagRepo = ds.getRepository(Tag)

  const publishedWhere = { status: CArticleStatus.PUBLISHED }

  const [categories, tagCounts] = await Promise.all([
    categoryRepo.find({ select: ['id', 'name', 'desc'], order: { id: 'ASC' } }),
    articleRepo
      .createQueryBuilder('a')
      .innerJoin('a.tags', 't')
      .select('t.id', 'tagId')
      .addSelect('COUNT(DISTINCT a.id)', 'cnt')
      .where('a.status = :status', { status: publishedWhere.status })
      .groupBy('t.id')
      .getRawMany<{ tagId: number; cnt: string }>()
  ])

  const categoryCounts = await articleRepo
    .createQueryBuilder('a')
    .select('a.categoryId', 'categoryId')
    .addSelect('COUNT(a.id)', 'cnt')
    .where('a.status = :status', { status: publishedWhere.status })
    .andWhere('a.categoryId IS NOT NULL')
    .groupBy('a.categoryId')
    .getRawMany<{ categoryId: number; cnt: string }>()

  const catCountMap = new Map(categoryCounts.map(r => [r.categoryId, Number(r.cnt)]))
  const tagCountMap = new Map(tagCounts.map(r => [r.tagId, Number(r.cnt)]))

  const catWeights = categories.map(c => ({
    id: c.id,
    name: c.name,
    desc: c.desc ?? null,
    weight: catCountMap.get(c.id) ?? 0,
    signalNoise: 0
  }))

  const tagList = await tagRepo.find({ select: ['id', 'name', 'color'], order: { id: 'ASC' } })
  const tagWeights = tagList.map(t => ({
    id: t.id,
    name: t.name,
    color: t.color ?? null,
    weight: tagCountMap.get(t.id) ?? 0,
    signalNoise: 0
  }))

  const allWeights = [...catWeights.map(x => x.weight), ...tagWeights.map(x => x.weight)].filter(w => w > 0)
  const maxW = allWeights.length ? Math.max(...allWeights) : 1

  function normalize(weight: number): number {
    if (maxW <= 0) return 0
    return Math.min(1, weight / maxW)
  }

  catWeights.forEach(item => { item.signalNoise = normalize(item.weight) })
  tagWeights.forEach(item => { item.signalNoise = normalize(item.weight) })

  return {
    categories: catWeights,
    tags: tagWeights
  }
}
