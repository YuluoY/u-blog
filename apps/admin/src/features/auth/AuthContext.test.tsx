import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth, FRONTEND_LOGIN_URL } from './AuthContext'

vi.mock('./api', () => ({
  refresh: vi.fn(),
}))

const { refresh } = await import('./api')

function TestConsumer() {
  const { user, loading } = useAuth()
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user ? user.username : 'null'}</span>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.mocked(refresh).mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sets user when refresh succeeds', async () => {
    vi.mocked(refresh).mockResolvedValueOnce({ id: 1, username: 'admin', role: 'admin' })
    render(<AuthProvider><TestConsumer /></AuthProvider>)
    expect(screen.getByTestId('loading').textContent).toBe('true')
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('admin'))
    expect(screen.getByTestId('loading').textContent).toBe('false')
  })

  it('sets user to null when refresh fails', async () => {
    vi.mocked(refresh).mockRejectedValueOnce(new Error('无效'))
    render(<AuthProvider><TestConsumer /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('false'))
    expect(screen.getByTestId('user').textContent).toBe('null')
  })

  it('retries on network error', async () => {
    const networkErr = new Error('Network Error')
    vi.mocked(refresh)
      .mockRejectedValueOnce(networkErr)
      .mockResolvedValueOnce({ id: 2, username: 'test', role: 'user' })
    render(<AuthProvider><TestConsumer /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('test'), { timeout: 5000 })
  })

  it('retries on 503 error', async () => {
    const err503 = Object.assign(new Error('503'), { response: { status: 503 } })
    vi.mocked(refresh)
      .mockRejectedValueOnce(err503)
      .mockResolvedValueOnce({ id: 3, username: 'admin2', role: 'super_admin' })
    render(<AuthProvider><TestConsumer /></AuthProvider>)
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('admin2'), { timeout: 5000 })
  })

  it('does not expose login function', () => {
    function CheckShape() {
      const ctx = useAuth()
      return <span data-testid="has-login">{String('login' in ctx)}</span>
    }
    vi.mocked(refresh).mockResolvedValueOnce({ id: 1, username: 'a' })
    render(<AuthProvider><CheckShape /></AuthProvider>)
    expect(screen.getByTestId('has-login').textContent).toBe('false')
  })

  it('exports FRONTEND_LOGIN_URL with /login path', () => {
    expect(FRONTEND_LOGIN_URL).toContain('/login')
  })
})
