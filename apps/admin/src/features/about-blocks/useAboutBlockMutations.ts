import { useMutation, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { addAboutBlock, updateAboutBlock, deleteAboutBlock } from './api'
import { aboutBlocksQueryKey } from './useAboutBlocks'

export function useAboutBlockMutations() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  const create = useMutation({
    mutationFn: addAboutBlock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aboutBlocksQueryKey })
      message.success('新增成功')
    },
    onError: (err: Error) => {
      message.error(err.message || '新增失败')
    },
  })

  const update = useMutation({
    mutationFn: ({ id, ...body }: { id: number; page?: string; sortOrder?: number; type?: string; title?: string; content?: string; extra?: Record<string, unknown> }) =>
      updateAboutBlock(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aboutBlocksQueryKey })
      message.success('更新成功')
    },
    onError: (err: Error) => {
      message.error(err.message || '更新失败')
    },
  })

  const remove = useMutation({
    mutationFn: deleteAboutBlock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aboutBlocksQueryKey })
      message.success('删除成功')
    },
    onError: (err: Error) => {
      message.error(err.message || '删除失败')
    },
  })

  return { create, update, remove }
}
