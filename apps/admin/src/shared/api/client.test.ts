import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import { apiClient, setMessageInstance, setOnUnauthorized } from './client'

let mock: MockAdapter

beforeEach(() => {
  mock = new MockAdapter(apiClient)
})

afterEach(() => {
  mock.restore()
  setMessageInstance(null)
  setOnUnauthorized(null)
})

describe('client interceptors', () => {
  it('passes through on code 0', async () => {
    mock.onPost('/test').reply(200, { code: 0, data: 'ok', message: '' })
    const res = await apiClient.post('/test')
    expect(res.data.data).toBe('ok')
  })

  it('rejects and shows message on non-zero code', async () => {
    const errorFn = vi.fn()
    setMessageInstance({ error: errorFn })
    mock.onPost('/fail').reply(200, { code: 1, data: null, message: '失败了' })
    await expect(apiClient.post('/fail')).rejects.toThrow('失败了')
    expect(errorFn).toHaveBeenCalledWith('失败了')
  })

  it('skipGlobalError suppresses toast on non-zero code', async () => {
    const errorFn = vi.fn()
    setMessageInstance({ error: errorFn })
    mock.onPost('/quiet').reply(200, { code: 1, data: null, message: '静默' })
    await expect(apiClient.post('/quiet', undefined, { skipGlobalError: true })).rejects.toThrow('静默')
    expect(errorFn).not.toHaveBeenCalled()
  })

  it('calls onUnauthorized on 401 HTTP error', async () => {
    const unauth = vi.fn()
    setOnUnauthorized(unauth)
    const errorFn = vi.fn()
    setMessageInstance({ error: errorFn })
    mock.onPost('/secure').reply(401, { code: 401, data: null, message: '未授权' })
    await expect(apiClient.post('/secure')).rejects.toThrow()
    expect(unauth).toHaveBeenCalled()
  })

  it('skipGlobalError suppresses 401 onUnauthorized', async () => {
    const unauth = vi.fn()
    setOnUnauthorized(unauth)
    mock.onPost('/refresh').reply(401, { code: 401, data: null, message: '' })
    await expect(apiClient.post('/refresh', undefined, { skipGlobalError: true })).rejects.toThrow()
    expect(unauth).not.toHaveBeenCalled()
  })
})
