import { useMutation, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { updateUser } from './api'
import { usersQueryKey } from './useUsers'

export function useUserMutations() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  const update = useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: number
      namec?: string
      role?: string
      bio?: string
      avatar?: string
      location?: string
    }) => updateUser(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersQueryKey })
      message.success('更新成功')
    },
    onError: (err: Error) => {
      message.error(err.message || '更新失败')
    },
  })

  return { update }
}
