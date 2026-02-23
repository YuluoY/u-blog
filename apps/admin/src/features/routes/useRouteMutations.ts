import { useMutation, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { addRoute, updateRoute, deleteRoute } from './api'
import { routesQueryKey } from './useRoutes'

export function useRouteMutations() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  const create = useMutation({
    mutationFn: (body: Record<string, unknown>) => addRoute(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: routesQueryKey })
      message.success('新增成功')
    },
    onError: (err: Error) => message.error(err.message || '新增失败'),
  })

  const update = useMutation({
    mutationFn: ({ id, ...body }: { id: number } & Record<string, unknown>) =>
      updateRoute(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: routesQueryKey })
      message.success('更新成功')
    },
    onError: (err: Error) => message.error(err.message || '更新失败'),
  })

  const remove = useMutation({
    mutationFn: (id: number) => deleteRoute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: routesQueryKey })
      message.success('删除成功')
    },
    onError: (err: Error) => message.error(err.message || '删除失败'),
  })

  return { create, update, remove }
}
