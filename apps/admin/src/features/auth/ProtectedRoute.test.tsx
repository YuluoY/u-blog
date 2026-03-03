import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { FRONTEND_LOGIN_URL } from './AuthContext'

const mockUseAuth = vi.fn()
vi.mock('./AuthContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./AuthContext')>()
  return {
    ...actual,
    useAuth: () => mockUseAuth(),
  }
})

const hrefSetter = vi.fn()
const originalLocation = window.location

beforeEach(() => {
  Object.defineProperty(window, 'location', {
    writable: true,
    value: { ...originalLocation, href: 'http://localhost:5174/dashboard' },
  })
  Object.defineProperty(window.location, 'href', {
    set: hrefSetter,
    get: () => 'http://localhost:5174/dashboard',
  })
})

afterEach(() => {
  Object.defineProperty(window, 'location', {
    writable: true,
    value: originalLocation,
  })
  vi.restoreAllMocks()
})

const { default: ProtectedRoute } = await import('./ProtectedRoute')

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter initialEntries={["/dashboard"]}>{ui}</MemoryRouter>)
}

describe('ProtectedRoute', () => {
  it('shows loading indicator while checking auth', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true })
    renderWithRouter(<ProtectedRoute><div data-testid="child">OK</div></ProtectedRoute>)
    expect(screen.getByText('加载中…')).toBeTruthy()
    expect(screen.queryByTestId('child')).toBeNull()
  })

  it('redirects to frontend login when not authenticated', async () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false })
    renderWithRouter(<ProtectedRoute><div data-testid="child">OK</div></ProtectedRoute>)
    expect(screen.queryByTestId('child')).toBeNull()
    await waitFor(() => {
      expect(hrefSetter).toHaveBeenCalled()
      const url = hrefSetter.mock.calls[0][0] as string
      expect(url).toContain(FRONTEND_LOGIN_URL)
      expect(url).toContain('returnUrl=')
    })
  })

  it('renders children when authenticated', () => {
    mockUseAuth.mockReturnValue({ user: { id: 1, username: 'admin' }, loading: false })
    renderWithRouter(<ProtectedRoute><div data-testid="child">OK</div></ProtectedRoute>)
    expect(screen.getByTestId('child')).toBeTruthy()
    expect(screen.getByTestId('child').textContent).toBe('OK')
  })
})
