import { useMutation, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { deleteView } from './api'
import { viewsQueryKey } from './useViews'

/** 浏览记录变更操作（仅删除） */
export function useViewMutations() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  const remove = useMutation({
    mutationFn: (id: number) => deleteView(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: viewsQueryKey })
      message.success('删除成功')
    },
    onError: (err: Error) => {
      message.error(err.message || '删除失败')
    },
  })

  return { remove }
}
