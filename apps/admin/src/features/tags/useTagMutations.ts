import { useMutation, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { addTag, updateTag, deleteTag } from './api'
import { tagsQueryKey } from './useTags'

export function useTagMutations() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  const create = useMutation({
    mutationFn: (body: { name: string; desc?: string; color?: string }) => addTag(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagsQueryKey })
      message.success('新增成功')
    },
    onError: (err: Error) => {
      message.error(err.message || '新增失败')
    },
  })

  const update = useMutation({
    mutationFn: ({ id, ...body }: { id: number; name?: string; desc?: string; color?: string }) =>
      updateTag(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagsQueryKey })
      message.success('更新成功')
    },
    onError: (err: Error) => {
      message.error(err.message || '更新失败')
    },
  })

  const remove = useMutation({
    mutationFn: (id: number) => deleteTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagsQueryKey })
      message.success('删除成功')
    },
    onError: (err: Error) => {
      message.error(err.message || '删除失败')
    },
  })

  return { create, update, remove }
}
