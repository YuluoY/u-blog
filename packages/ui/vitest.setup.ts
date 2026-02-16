import { vi } from 'vitest'

vi.mock('@/components/code-editor', () => ({
  UCodeEditor: { name: 'UCodeEditor', template: '<div></div>' },
  default: { name: 'UCodeEditor', template: '<div></div>' }
}))

vi.mock('@u-blog/composables', () => ({
  useResize: vi.fn(() => ({})),
  useDraggle: vi.fn(() => ({})),
  useScrollTo: vi.fn(() => ({ scrollTo: vi.fn() })),
  useEventListener: vi.fn(),
  useOffset: vi.fn(() => ({ topOffset: { value: 0 }, bottomOffset: { value: 0 } })),
  useZIndex: vi.fn(() => ({ nextZIndex: vi.fn(() => 2000) })),
  useWatchRef: vi.fn((val: any) => ({ value: val })),
  useClickOutside: vi.fn(),
  useState: vi.fn((initial: any) => [{ value: initial }, vi.fn()]),
  useFixed: vi.fn(),
  useDebounceRef: vi.fn((val: any) => ({ value: val }))
}))
