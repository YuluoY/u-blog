import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteConversation } from './api'
import { xiaohuiQueryKey } from './useXiaohuiConversations'

export function useXiaohuiMutations() {
  const qc = useQueryClient()

  const remove = useMutation({
    mutationFn: deleteConversation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: xiaohuiQueryKey })
    },
  })

  return { remove }
}
