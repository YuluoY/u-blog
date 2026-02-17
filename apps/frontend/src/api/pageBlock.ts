import { restQuery } from './request'
import type { IPageBlockVo } from '@u-blog/model'

const PAGE_ABOUT = 'about'

/**
 * 获取关于页区块列表（按 sortOrder 升序）
 */
export async function getAboutBlocks(): Promise<IPageBlockVo[]> {
  const list = await restQuery<IPageBlockVo[]>('page_block', {
    where: { page: PAGE_ABOUT },
    order: { sortOrder: 'ASC' },
    take: 100
  })
  return Array.isArray(list) ? list : []
}
