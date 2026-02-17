import { useMutation, useQueryClient } from '@tanstack/react-query'
import { App } from 'antd'
import { updateSetting } from './api'
import { settingsQueryKey } from './useSettings'

export function useSettingMutations() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()

  const update = useMutation({
    mutationFn: ({ id, ...body }: { id: number; value?: unknown; desc?: string }) =>
      updateSetting(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsQueryKey })
      message.success('更新成功')
    },
    onError: (err: Error) => {
      message.error(err.message || '更新失败')
    },
  })

  return { update }
}
