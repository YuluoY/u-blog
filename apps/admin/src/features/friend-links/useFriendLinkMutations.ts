import { useMutation, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { addFriendLink, updateFriendLink, deleteFriendLink, reviewFriendLink } from './api'
import { friendLinksQueryKey } from './useFriendLinks'

export function useFriendLinkMutations() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  const create = useMutation({
    mutationFn: (body: Record<string, unknown>) => addFriendLink(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendLinksQueryKey })
      message.success('新增成功')
    },
    onError: (err: Error) => message.error(err.message || '新增失败'),
  })

  const update = useMutation({
    mutationFn: ({ id, ...body }: { id: number } & Record<string, unknown>) =>
      updateFriendLink(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendLinksQueryKey })
      message.success('更新成功')
    },
    onError: (err: Error) => message.error(err.message || '更新失败'),
  })

  const remove = useMutation({
    mutationFn: (id: number) => deleteFriendLink(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendLinksQueryKey })
      message.success('删除成功')
    },
    onError: (err: Error) => message.error(err.message || '删除失败'),
  })

  const review = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'approved' | 'rejected' }) =>
      reviewFriendLink(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendLinksQueryKey })
      message.success('审核成功')
    },
    onError: (err: Error) => message.error(err.message || '审核失败'),
  })

  return { create, update, remove, review }
}
