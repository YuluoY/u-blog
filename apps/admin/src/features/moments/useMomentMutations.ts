import { useMutation, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { addMoment, updateMoment, deleteMoment } from './api'
import type { MomentItem } from './api'
import { momentsQueryKey } from './useMoments'

export function useMomentMutations() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  const create = useMutation({
    mutationFn: (body: Partial<MomentItem>) => addMoment(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: momentsQueryKey })
      message.success('新增成功')
    },
    onError: (err: Error) => {
      message.error(err.message || '新增失败')
    },
  })

  const update = useMutation({
    mutationFn: ({ id, ...body }: Partial<MomentItem> & { id: number }) =>
      updateMoment(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: momentsQueryKey })
      message.success('更新成功')
    },
    onError: (err: Error) => {
      message.error(err.message || '更新失败')
    },
  })

  const remove = useMutation({
    mutationFn: (id: number) => deleteMoment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: momentsQueryKey })
      message.success('删除成功')
    },
    onError: (err: Error) => {
      message.error(err.message || '删除失败')
    },
  })

  return { create, update, remove }
}
