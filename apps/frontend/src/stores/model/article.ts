import api from '@/api'
import { CTable, type IArticle } from '@u-blog/model'
import { useState } from '@u-blog/composables'
import { defineStore } from 'pinia'
import { PAGE_SIZE } from '@/api/article'
import { useAppStore } from '@/stores/app'
import { useUserStore } from '@/stores/model/user'
import { useBlogOwnerStore } from '@/stores/blogOwner'

export const useArticleStore = defineStore('article', () =>
{
  const appStore = useAppStore()
  const userStore = useUserStore()
  const blogOwnerStore = useBlogOwnerStore()
  const [articleList, setArticleList] = useState<IArticle[]>([])
  /** 归档页时间线用（来自接口） */
  const [archiveList, setArchiveList] = useState<IArticle[]>([])
  const [currentArticle, setCurrentArticle] = useState<IArticle | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [archiveLoading, setArchiveLoading] = useState(false)

  /**
   * 获取过滤用的 userId：
   * 1. 子域名博客模式 → 优先使用博客拥有者 ID
   * 2. 登录用户开启"仅展示我的文章" → 使用当前用户 ID
   */
  function getFilterUserId(): number | undefined {
    // 子域名模式：始终过滤为博客拥有者的文章
    if (blogOwnerStore.isSubdomainMode && blogOwnerStore.blogOwnerId) {
      return blogOwnerStore.blogOwnerId
    }
    if (appStore.onlyOwnArticles && userStore.isLoggedIn && userStore.user?.id) {
      return userStore.user.id as number
    }
    return undefined
  }

  /** 加载第一页（重置列表），排序依 appStore.homeSort */
  const qryArticleList = async() =>
  {
    setLoading(true)
    setPage(1)
    setHasMore(true)
    try {
      const sort = appStore.homeSort ?? 'date'
      const list = await api(CTable.ARTICLE).getArticleList(1, PAGE_SIZE, sort, getFilterUserId())
      setArticleList(list)
      if (list.length < PAGE_SIZE) setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  /** 加载更多（追加到列表末尾），排序依 appStore.homeSort */
  const loadMore = async() =>
  {
    if (loading.value || !hasMore.value) return
    setLoading(true)
    const nextPage = page.value + 1
    try {
      const sort = appStore.homeSort ?? 'date'
      const list = await api(CTable.ARTICLE).getArticleList(nextPage, PAGE_SIZE, sort, getFilterUserId())
      if (list.length > 0) {
        setArticleList([...articleList.value, ...list])
        setPage(nextPage)
      }
      if (list.length < PAGE_SIZE) setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  /** 归档页：拉取全部文章（按时间倒序） */
  const qryArchiveList = async() =>
  {
    setArchiveLoading(true)
    try {
      const list = await api(CTable.ARTICLE).getArticleListForArchive(500, getFilterUserId())
      setArchiveList(list)
    } finally {
      setArchiveLoading(false)
    }
  }

  /** 根据 id 查询单篇文章 */
  const qryArticleById = async(id: string) =>
  {
    const article = await api(CTable.ARTICLE).getArticleById(id)
    setCurrentArticle(article)
    return article
  }

  /** 本地查找 */
  const findArticleById = (id: string) =>
  {
    const numId = parseInt(id, 10)
    return articleList.value.find(article => article.id === numId || String(article.id) === id)
  }

  return {
    articleList,
    archiveList,
    currentArticle,
    page,
    loading,
    hasMore,
    archiveLoading,
    setArticleList,
    setArchiveList,
    setCurrentArticle,
    qryArticleList,
    qryArchiveList,
    qryArticleById,
    findArticleById,
    loadMore,
  }
})
