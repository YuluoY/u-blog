import { useMutation, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { addAnnouncement, updateAnnouncement, deleteAnnouncement } from './api'
import type { AnnouncementItem } from './api'
import { announcementsQueryKey } from './useAnnouncements'

export function useAnnouncementMutations() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  const create = useMutation({
    mutationFn: (body: Partial<AnnouncementItem>) => addAnnouncement(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementsQueryKey })
      message.success('新增成功')
    },
    onError: (err: Error) => {
      message.error(err.message || '新增失败')
    },
  })

  const update = useMutation({
    mutationFn: ({ id, ...body }: Partial<AnnouncementItem> & { id: number }) =>
      updateAnnouncement(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementsQueryKey })
      message.success('更新成功')
    },
    onError: (err: Error) => {
      message.error(err.message || '更新失败')
    },
  })

  const remove = useMutation({
    mutationFn: (id: number) => deleteAnnouncement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementsQueryKey })
      message.success('删除成功')
    },
    onError: (err: Error) => {
      message.error(err.message || '删除失败')
    },
  })

  return { create, update, remove }
}
