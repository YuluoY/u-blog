import type { QueryKey } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { updateArticle, deleteArticle } from './api'
import { articlesQueryKey } from './useArticles'
import type { ArticleItem } from './api'

type ArticleUpdateBody = {
  id: number
  title?: string
  content?: string
  desc?: string
  cover?: string
  status?: string
  isPrivate?: boolean
  isTop?: boolean
  categoryId?: number | null
  publishedAt?: string
}

export function useArticleMutations() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  const update = useMutation({
    mutationFn: ({ id, ...body }: ArticleUpdateBody) => updateArticle(id, body),
    onMutate: async (variables) => {
      const queries = queryClient.getQueriesData<ArticleItem[]>({ queryKey: articlesQueryKey })
      const previous: Array<[QueryKey, ArticleItem[] | undefined]> = []
      queries.forEach(([qk, data]) => {
        if (Array.isArray(data)) {
          previous.push([qk, data])
          queryClient.setQueryData(
            qk,
            data.map((a) => (a.id === variables.id ? { ...a, ...variables } : a))
          )
        }
      })
      return { previous }
    },
    onSuccess: (data: ArticleItem) => {
      const queries = queryClient.getQueriesData<ArticleItem[]>({ queryKey: articlesQueryKey })
      queries.forEach(([qk, list]) => {
        if (Array.isArray(list)) {
          queryClient.setQueryData(
            qk,
            list.map((a) => (a.id === data.id ? { ...a, ...data } : a))
          )
        }
      })
      message.success('更新成功')
    },
    onError: (err: Error, _variables, context) => {
      if (context?.previous) {
        context.previous.forEach(([qk, data]) => {
          queryClient.setQueryData(qk as QueryKey, data)
        })
      }
      message.error(err.message || '更新失败')
    },
  })

  const remove = useMutation({
    mutationFn: deleteArticle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: articlesQueryKey })
      message.success('删除成功')
    },
    onError: (err: Error) => {
      message.error(err.message || '删除失败')
    },
  })

  return { update, remove }
}
