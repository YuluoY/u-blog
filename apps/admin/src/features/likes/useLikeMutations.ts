import { useMutation, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { deleteLike } from './api'
import { likesQueryKey } from './useLikes'

/** 点赞记录变更操作（仅删除） */
export function useLikeMutations() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  const remove = useMutation({
    mutationFn: (id: number) => deleteLike(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: likesQueryKey })
      message.success('删除成功')
    },
    onError: (err: Error) => {
      message.error(err.message || '删除失败')
    },
  })

  return { remove }
}
