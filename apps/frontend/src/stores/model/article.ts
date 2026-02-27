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
  /** 归档分页：当前页码 */
  const [archivePage, setArchivePage] = useState(1)
  /** 归档分页：是否还有更多数据 */
  const [archiveHasMore, setArchiveHasMore] = useState(true)
  /** 归档每页条数（比首页大，因为归档卡片更紧凑） */
  const ARCHIVE_PAGE_SIZE = 30

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
    // 首页尚未加载初始数据时，不触发加载更多（避免 Observer 在空列表时误触发）
    if (loading.value || !hasMore.value || articleList.value.length === 0) return
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

  /** 归档页：首次加载（重置列表，分页拉取） */
  const qryArchiveList = async() =>
  {
    setArchiveLoading(true)
    setArchivePage(1)
    setArchiveHasMore(true)
    try {
      const list = await api(CTable.ARTICLE).getArticleListForArchive(ARCHIVE_PAGE_SIZE, 0, getFilterUserId())
      setArchiveList(list)
      if (list.length < ARCHIVE_PAGE_SIZE) setArchiveHasMore(false)
    } finally {
      setArchiveLoading(false)
    }
  }

  /** 归档页：加载更多（追加到列表） */
  const loadMoreArchive = async() =>
  {
    if (archiveLoading.value || !archiveHasMore.value) return
    setArchiveLoading(true)
    const nextPage = archivePage.value + 1
    try {
      const skip = (nextPage - 1) * ARCHIVE_PAGE_SIZE
      const list = await api(CTable.ARTICLE).getArticleListForArchive(ARCHIVE_PAGE_SIZE, skip, getFilterUserId())
      if (list.length > 0) {
        setArchiveList([...archiveList.value, ...list])
        setArchivePage(nextPage)
      }
      if (list.length < ARCHIVE_PAGE_SIZE) setArchiveHasMore(false)
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

  /**
   * 同步文章浏览量（从 ReadView 浏览后回写到列表，避免回到首页/归档看到旧数据）
   */
  const updateArticleViewCount = (articleId: number, viewCount: number) =>
  {
    const updateList = (list: IArticle[]) =>
      list.map(a => a.id === articleId ? { ...a, viewCount } : a)
    setArticleList(updateList(articleList.value))
    setArchiveList(updateList(archiveList.value))
    if (currentArticle.value?.id === articleId) {
      setCurrentArticle({ ...currentArticle.value, viewCount })
    }
  }

  /**
   * 同步文章点赞数（从 ReadView 点赞后回写到列表，避免回到首页/归档看到旧数据）
   * 同时更新 articleList 和 archiveList 中匹配的条目
   */
  const updateArticleLikeCount = (articleId: number, likeCount: number) =>
  {
    const updateList = (list: IArticle[]) =>
      list.map(a => a.id === articleId ? { ...a, likeCount } : a)
    setArticleList(updateList(articleList.value))
    setArchiveList(updateList(archiveList.value))
    // 同步 currentArticle
    if (currentArticle.value?.id === articleId) {
      setCurrentArticle({ ...currentArticle.value, likeCount })
    }
  }

  return {
    articleList,
    archiveList,
    currentArticle,
    page,
    loading,
    hasMore,
    archiveLoading,
    archiveHasMore,
    setArticleList,
    setArchiveList,
    setCurrentArticle,
    qryArticleList,
    qryArchiveList,
    loadMoreArchive,
    qryArticleById,
    updateArticleLikeCount,
    updateArticleViewCount,
    findArticleById,
    loadMore,
  }
})
