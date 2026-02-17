import { useMutation, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { deleteComment } from './api'
import { commentsQueryKey } from './useComments'

export function useCommentMutations() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  const remove = useMutation({
    mutationFn: (id: number) => deleteComment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentsQueryKey })
      message.success('删除成功')
    },
    onError: (err: Error) => {
      message.error(err.message || '删除失败')
    },
  })

  return { remove }
}
