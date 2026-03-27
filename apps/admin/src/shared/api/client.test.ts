import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import { apiClient, setMessageInstance, setOnUnauthorized, setAccessToken } from './client'

let mock: MockAdapter

beforeEach(() => {
  mock = new MockAdapter(apiClient)
  setAccessToken(null)
})

afterEach(() => {
  mock.restore()
  setMessageInstance(null)
  setOnUnauthorized(null)
  setAccessToken(null)
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

  it('calls onUnauthorized on 401 when refresh also fails', async () => {
    const unauth = vi.fn()
    setOnUnauthorized(unauth)
    const errorFn = vi.fn()
    setMessageInstance({ error: errorFn })
    mock.onPost('/secure').reply(401, { code: 401, data: null, message: '未授权' })
    // refresh 也失败
    mock.onPost('/refresh').reply(401, { code: 401, data: null, message: '' })
    await expect(apiClient.post('/secure')).rejects.toThrow()
    expect(unauth).toHaveBeenCalled()
  })

  it('retries original request after successful token refresh', async () => {
    setAccessToken('old-token')
    let callCount = 0
    mock.onPost('/protected').reply(() => {
      callCount++
      if (callCount === 1) return [401, { code: 401, data: null, message: '' }]
      return [200, { code: 0, data: 'success', message: '' }]
    })
    mock.onPost('/refresh').reply(200, { code: 0, data: { token: 'new-token' }, message: '' })
    const res = await apiClient.post('/protected')
    expect(res.data.data).toBe('success')
    expect(callCount).toBe(2)
  })

  it('skipGlobalError suppresses 401 onUnauthorized', async () => {
    const unauth = vi.fn()
    setOnUnauthorized(unauth)
    mock.onPost('/some-api').reply(401, { code: 401, data: null, message: '' })
    mock.onPost('/refresh').reply(401, { code: 401, data: null, message: '' })
    await expect(apiClient.post('/some-api', undefined, { skipGlobalError: true })).rejects.toThrow()
    expect(unauth).not.toHaveBeenCalled()
  })
})
