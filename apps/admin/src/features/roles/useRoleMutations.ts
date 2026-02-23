import { useMutation, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { addRole, updateRole, deleteRole } from './api'
import { rolesQueryKey } from './useRoles'

export function useRoleMutations() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  const create = useMutation({
    mutationFn: (body: { name: string; desc: string; permissions?: { id: number }[] }) => addRole(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesQueryKey })
      message.success('新增成功')
    },
    onError: (err: Error) => message.error(err.message || '新增失败'),
  })

  const update = useMutation({
    mutationFn: ({ id, ...body }: { id: number; name?: string; desc?: string; permissions?: { id: number }[] }) =>
      updateRole(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesQueryKey })
      message.success('更新成功')
    },
    onError: (err: Error) => message.error(err.message || '更新失败'),
  })

  const remove = useMutation({
    mutationFn: (id: number) => deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesQueryKey })
      message.success('删除成功')
    },
    onError: (err: Error) => message.error(err.message || '删除失败'),
  })

  return { create, update, remove }
}
