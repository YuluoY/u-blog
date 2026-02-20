import request from './request'
import type { BackendResponse } from './request'

/** 词云单项：权重为文章数，声噪为归一化 0~1 */
export interface CloudItem {
  id: number
  name: string
  weight: number
  signalNoise: number
}

export interface CloudWeightsData {
  categories: (CloudItem & { desc?: string | null })[]
  tags: (CloudItem & { color?: string | null })[]
}

/**
 * 获取类别/标签的权重与声噪，供词云等可视化使用
 */
export async function getCloudWeights(): Promise<CloudWeightsData> {
  const res = await request.get<BackendResponse<CloudWeightsData>>('/cloud-weights')
  const payload = res.data
  if (payload.code !== 0) {
    throw new Error(payload.message || '获取词云权重失败')
  }
  return (payload.data ?? { categories: [], tags: [] }) as CloudWeightsData
}
