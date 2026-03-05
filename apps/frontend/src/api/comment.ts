import type { IComment } from '@u-blog/model'
import type { ApiMethod } from './types'
import { restQuery, restAdd } from './request'

/** 分页拉取评论的默认每页条数 */
export const COMMENT_PAGE_SIZE = 20

export interface ICommentApis {
  [keyof: string]: ApiMethod
  /** 按 path 分页查询评论列表 */
  getCommentList: (path: string, page?: number, pageSize?: number) => Promise<IComment[]>
  addComment: (data: {
    content: string
    path: string
    /** 登录用户 ID（游客时不传） */
    userId?: number | null
    /** 游客昵称（未登录时必填） */
    nickname?: string
    /** 游客邮箱（未登录时必填） */
    email?: string
    pid?: number | null
    articleId?: number | null
  }) => Promise<{ id: number }>
}

const apis: ICommentApis = {
  async getCommentList(path: string, page = 1, pageSize = COMMENT_PAGE_SIZE)
  {
    try
    {
      const body: Parameters<typeof restQuery>[1] = {
        where: { path },
        take: pageSize,
        skip: (page - 1) * pageSize,
        order: { createdAt: 'DESC' },
        relations: ['user']
      }
      const list = await restQuery<IComment[]>('comment', body)
      return Array.isArray(list) ? list : []
    }
    catch
    {
      return []
    }
  },
  async addComment(data)
  {
    const ret = await restAdd<{ id: number }>('comment', data)
    return ret as { id: number }
  }
}

export default apis
