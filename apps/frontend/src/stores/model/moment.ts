import momentApis, { MOMENT_PAGE_SIZE } from '@/api/moment'
import type { IMoment } from '@u-blog/model'
import { useState } from '@u-blog/composables'
import { defineStore } from 'pinia'

/**
 * 动态列表 Store
 *
 * 管理动态的分页加载、无限滚动追加、单条同步等状态。
 * 与 articleStore 保持一致的模式：首页加载 + loadMore 追加。
 */
export const useMomentStore = defineStore('moment', () => {
  const [momentList, setMomentList] = useState<IMoment[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  /**
   * 加载第一页（重置列表）
   * 置顶优先 + 时间倒序
   */
  const qryMomentList = async () => {
    setLoading(true)
    setPage(1)
    setHasMore(true)
    try {
      const list = await momentApis.getMomentList(1, MOMENT_PAGE_SIZE)
      setMomentList(list)
      if (list.length < MOMENT_PAGE_SIZE) setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 加载更多（追加到列表末尾）
   * 无限滚动触发时调用
   */
  const loadMore = async () => {
    if (loading.value || !hasMore.value || momentList.value.length === 0) return
    setLoading(true)
    const nextPage = page.value + 1
    try {
      const list = await momentApis.getMomentList(nextPage, MOMENT_PAGE_SIZE)
      if (list.length > 0) {
        setMomentList([...momentList.value, ...list])
        setPage(nextPage)
      }
      if (list.length < MOMENT_PAGE_SIZE) setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  /**
   * 将新发布的动态插入列表顶部
   * 用于发布后即时展示，无需重新拉取整个列表
   */
  const prependMoment = (moment: IMoment) => {
    setMomentList([moment, ...momentList.value])
  }

  /**
   * 同步单条动态到列表（就地更新）
   * 用于点赞数、评论数等字段变更后的即时同步
   */
  const syncMoment = (updated: Partial<IMoment> & { id: number }) => {
    setMomentList(
      momentList.value.map(m =>
        m.id === updated.id ? { ...m, ...updated } : m,
      ),
    )
  }

  /**
   * 从列表中移除指定动态
   */
  const removeMoment = (id: number) => {
    setMomentList(momentList.value.filter(m => m.id !== id))
  }

  return {
    momentList,
    page,
    loading,
    hasMore,
    setMomentList,
    qryMomentList,
    loadMore,
    prependMoment,
    syncMoment,
    removeMoment,
  }
})
