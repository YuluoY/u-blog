import { useMutation, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { addPermission, updatePermission, deletePermission } from './api'
import { permissionsQueryKey } from './usePermissions'

export function usePermissionMutations() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  const create = useMutation({
    mutationFn: (body: Record<string, unknown>) => addPermission(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permissionsQueryKey })
      message.success('新增成功')
    },
    onError: (err: Error) => message.error(err.message || '新增失败'),
  })

  const update = useMutation({
    mutationFn: ({ id, ...body }: { id: number } & Record<string, unknown>) =>
      updatePermission(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permissionsQueryKey })
      message.success('更新成功')
    },
    onError: (err: Error) => message.error(err.message || '更新失败'),
  })

  const remove = useMutation({
    mutationFn: (id: number) => deletePermission(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: permissionsQueryKey })
      message.success('删除成功')
    },
    onError: (err: Error) => message.error(err.message || '删除失败'),
  })

  return { create, update, remove }
}
