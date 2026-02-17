import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { BackendResponse } from './types'
import { restQuery, restAdd, restUpdate, restDel } from './rest'

vi.mock('./client', () => ({
  apiClient: {
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

const { apiClient } = await import('./client')

function mockRes<T>(data: T): { data: BackendResponse<T> } {
  return { data: { code: 0, data, message: '' } }
}

describe('rest', () => {
  beforeEach(() => {
    vi.mocked(apiClient.post).mockReset()
    vi.mocked(apiClient.put).mockReset()
    vi.mocked(apiClient.delete).mockReset()
  })

  it('restQuery sends POST with model and body, returns data', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockRes([1, 2]) as never)
    const out = await restQuery('category', { take: 10 })
    expect(apiClient.post).toHaveBeenCalledWith('/rest/category/query', { take: 10 })
    expect(out).toEqual([1, 2])
  })

  it('restAdd sends POST with body, returns data', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce(mockRes({ id: 1, name: 'x' }) as never)
    const out = await restAdd('category', { name: 'x' })
    expect(apiClient.post).toHaveBeenCalledWith('/rest/category/add', { name: 'x' })
    expect(out).toEqual({ id: 1, name: 'x' })
  })

  it('restUpdate sends PUT with id and body', async () => {
    vi.mocked(apiClient.put).mockResolvedValueOnce(mockRes({ id: 1, name: 'y' }) as never)
    const out = await restUpdate('category', 1, { name: 'y' })
    expect(apiClient.put).toHaveBeenCalledWith('/rest/category/update', { id: 1, name: 'y' })
    expect(out).toEqual({ id: 1, name: 'y' })
  })

  it('restDel sends DELETE with data id', async () => {
    vi.mocked(apiClient.delete).mockResolvedValueOnce(mockRes(null) as never)
    await restDel('category', 1)
    expect(apiClient.delete).toHaveBeenCalledWith('/rest/category/del', { data: { id: 1 } })
  })
})
