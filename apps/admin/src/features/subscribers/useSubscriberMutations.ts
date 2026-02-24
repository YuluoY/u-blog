import { useMutation, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { deleteSubscriber } from './api'
import { subscribersQueryKey } from './useSubscribers'

export function useSubscriberMutations() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  const remove = useMutation({
    mutationFn: (id: number) => deleteSubscriber(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subscribersQueryKey })
      message.success('删除成功')
    },
    onError: (err: Error) => {
      message.error(err.message || '删除失败')
    },
  })

  return { remove }
}
