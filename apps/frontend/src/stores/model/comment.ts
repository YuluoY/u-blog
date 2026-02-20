import api from '@/api'
import { CTable, type IComment } from '@u-blog/model'
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { COMMENT_PAGE_SIZE } from '@/api/comment'

/** 单个 path 下的评论列表与分页状态 */
export interface CommentPathState {
  list: IComment[]
  page: number
  hasMore: boolean
  loading: boolean
}

const createInitialState = (): CommentPathState => ({
  list: [],
  page: 0,
  hasMore: true,
  loading: false
})

export const useCommentStore = defineStore('comment', () => {
  /** 按 path 缓存的评论状态 */
  const stateByPath = ref<Record<string, CommentPathState>>({})

  /** 获取指定 path 的状态，不存在则初始化 */
  function getState(path: string): CommentPathState {
    if (!stateByPath.value[path]) {
      stateByPath.value[path] = createInitialState()
    }
    return stateByPath.value[path]
  }

  /**
   * 按 path 分页拉取评论
   * @param path 评论路由路径，如 /read/1、/message
   * @param append true 时追加下一页，false 时从第一页重新拉取
   */
  const qryCommentListByPath = async (path: string, append = false) => {
    const state = getState(path)
    if (state.loading) return
    state.loading = true
    const nextPage = append ? state.page + 1 : 1
    try {
      const list = await api(CTable.COMMENT).getCommentList(path, nextPage, COMMENT_PAGE_SIZE)
      if (append) {
        state.list = [...state.list, ...list]
      } else {
        state.list = list
      }
      state.page = nextPage
      state.hasMore = list.length >= COMMENT_PAGE_SIZE
    } finally {
      state.loading = false
    }
  }

  /** 当前 path 的评论列表（供 ReadView 等按 path 消费时用 computed(path) 包装） */
  const getListByPath = (path: string) => computed(() => getState(path).list)
  const getLoadingByPath = (path: string) => computed(() => getState(path).loading)
  const getHasMoreByPath = (path: string) => computed(() => getState(path).hasMore)

  /** 向指定 path 的列表头部插入一条（发表新评论后本地追加） */
  function prependComment(path: string, comment: IComment) {
    const state = getState(path)
    state.list = [comment, ...state.list]
  }

  /** 清空某 path 缓存（可选，如登出后） */
  function clearPath(path: string) {
    delete stateByPath.value[path]
  }

  return {
    stateByPath,
    getState,
    qryCommentListByPath,
    getListByPath,
    getLoadingByPath,
    getHasMoreByPath,
    prependComment,
    clearPath
  }
})
