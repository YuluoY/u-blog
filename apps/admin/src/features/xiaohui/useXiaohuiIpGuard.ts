import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createXiaohuiIpBan, queryXiaohuiIpGuardList, removeXiaohuiIpBan } from './api'

const xiaohuiIpGuardKey = ['xiaohui-ip-guard'] as const

export function useXiaohuiIpGuardList() {
  return useQuery({
    queryKey: xiaohuiIpGuardKey,
    queryFn: queryXiaohuiIpGuardList,
    refetchInterval: 15_000,
  })
}

export function useXiaohuiIpGuardMutations() {
  const qc = useQueryClient()

  const ban = useMutation({
    mutationFn: createXiaohuiIpBan,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: xiaohuiIpGuardKey })
    },
  })

  const unban = useMutation({
    mutationFn: removeXiaohuiIpBan,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: xiaohuiIpGuardKey })
    },
  })

  return { ban, unban }
}
