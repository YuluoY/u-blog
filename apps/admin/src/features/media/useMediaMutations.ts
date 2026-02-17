import { useMutation, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { deleteMedia } from './api'
import { mediaQueryKey } from './useMedia'

export function useMediaMutations() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  const remove = useMutation({
    mutationFn: deleteMedia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaQueryKey })
      message.success('删除成功')
    },
    onError: (err: Error) => {
      message.error(err.message || '删除失败')
    },
  })

  return { remove }
}
