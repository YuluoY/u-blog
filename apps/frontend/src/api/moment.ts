import type { IMoment } from '@u-blog/model'
import { CMomentVisibility } from '@u-blog/model'
import { restQuery, restAdd, restUpdate, restDel } from './request'
import request from './request'
import type { BackendResponse } from './request'

/** 动态列表每页条数 */
export const MOMENT_PAGE_SIZE = 10

/**
 * 动态列表查询时排除的字段 —— 仅在需要减少体积时使用。
 * 目前动态内容一般较短，暂不做字段裁剪。
 */

/** 动态列表默认排序：置顶优先 + 创建时间倒序 */
const MOMENT_LIST_ORDER = { isPinned: 'DESC', createdAt: 'DESC' } as const

export interface IMomentApis {
  [key: string]: (...args: any[]) => Promise<any>
  /** 分页查询公开动态列表 */
  getMomentList: (page?: number, pageSize?: number) => Promise<IMoment[]>
  /** 根据 ID 查询单条动态 */
  getMomentById: (id: number) => Promise<IMoment | null>
  /** 创建动态（仅博主） */
  createMoment: (payload: Partial<IMoment>) => Promise<IMoment>
  /** 更新动态（仅博主） */
  updateMoment: (id: number, payload: Partial<IMoment>) => Promise<IMoment>
  /** 删除动态（仅博主） */
  deleteMoment: (id: number) => Promise<void>
}

const apis: IMomentApis = {
  /**
   * 分页查询公开动态列表
   * 仅返回 visibility=public 的动态，置顶优先 + 时间倒序
   */
  async getMomentList(page = 1, pageSize = MOMENT_PAGE_SIZE) {
    try {
      const list = await restQuery<IMoment[]>('moment', {
        where: { visibility: CMomentVisibility.PUBLIC },
        take: pageSize,
        skip: (page - 1) * pageSize,
        order: MOMENT_LIST_ORDER as Record<string, 'ASC' | 'DESC'>,
        relations: ['user'],
      })
      return Array.isArray(list) ? list : []
    } catch {
      return []
    }
  },

  /** 根据 ID 查询单条动态（含发布者信息） */
  async getMomentById(id: number) {
    try {
      const list = await restQuery<IMoment[]>('moment', {
        where: { id },
        take: 1,
        relations: ['user'],
      })
      const arr = Array.isArray(list) ? list : []
      return arr[0] ?? null
    } catch {
      return null
    }
  },

  /** 创建动态 */
  async createMoment(payload: Partial<IMoment>) {
    return restAdd<IMoment>('moment', payload as Record<string, unknown>)
  },

  /** 更新动态 */
  async updateMoment(id: number, payload: Partial<IMoment>) {
    return restUpdate<IMoment>('moment', id, payload as Record<string, unknown>)
  },

  /** 删除动态 */
  async deleteMoment(id: number) {
    return restDel('moment', id)
  },
}

/**
 * 切换动态点赞状态
 * @param momentId 动态 ID
 * @param fingerprint 可选的浏览器指纹
 * @returns { liked, likeCount }
 */
export async function toggleMomentLike(
  momentId: number,
  fingerprint?: string,
): Promise<{ liked: boolean; likeCount: number }> {
  const res = await request.post<BackendResponse<{ liked: boolean; likeCount: number }>>(
    '/moment/like',
    { momentId, fingerprint },
  )
  const payload = res.data
  if (payload.code !== 0)
    throw new Error(payload.message || '操作失败')
  return payload.data
}

/**
 * 查询动态点赞状态
 * @param momentId 动态 ID
 * @param fingerprint 可选的浏览器指纹
 * @returns { liked }
 */
export async function getMomentLikeStatus(
  momentId: number,
  fingerprint?: string,
): Promise<{ liked: boolean }> {
  const params: Record<string, string> = { momentId: String(momentId) }
  if (fingerprint) params.fingerprint = fingerprint
  const res = await request.get<BackendResponse<{ liked: boolean }>>(
    '/moment/like-status',
    { params },
  )
  const payload = res.data
  if (payload.code !== 0)
    throw new Error(payload.message || '查询失败')
  return payload.data
}

export default apis
