import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { BackendResponse } from './types'

vi.mock('./client', () => ({
  apiClient: {
    post: vi.fn(),
  },
}))

const { apiClient } = await import('./client')
const { refresh } = await import('./auth')

function mockRes<T>(code: number, data: T, message = ''): { data: BackendResponse<T> } {
  return { data: { code, data, message } }
}

describe('shared/api/auth', () => {
  beforeEach(() => {
    vi.mocked(apiClient.post).mockReset()
  })

  it('refresh returns user data on success', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockRes(0, { id: 1, username: 'admin' }) as never)
    const result = await refresh()
    expect(apiClient.post).toHaveBeenCalledWith('/refresh', undefined, { skipGlobalError: true })
    expect(result).toEqual({ id: 1, username: 'admin' })
  })

  it('refresh returns null on non-zero code', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockRes(1, null, '令牌无效') as never)
    const result = await refresh()
    expect(result).toBeNull()
  })

  it('refresh propagates network errors', async () => {
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Network Error'))
    await expect(refresh()).rejects.toThrow('Network Error')
  })
})
