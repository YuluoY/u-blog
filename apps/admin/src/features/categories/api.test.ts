import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  queryCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  type CategoryItem,
} from './api'

vi.mock('../../shared/api/rest', () => ({
  restQuery: vi.fn(),
  restAdd: vi.fn(),
  restUpdate: vi.fn(),
  restDel: vi.fn(),
}))

const rest = await import('../../shared/api/rest')

describe('categories api', () => {
  beforeEach(() => {
    vi.mocked(rest.restQuery).mockReset()
    vi.mocked(rest.restAdd).mockReset()
    vi.mocked(rest.restUpdate).mockReset()
    vi.mocked(rest.restDel).mockReset()
  })

  it('queryCategories calls restQuery with category and default take/skip/order', async () => {
    const list: CategoryItem[] = [{ id: 1, name: '技术' }]
    vi.mocked(rest.restQuery).mockResolvedValueOnce(list)
    const out = await queryCategories()
    expect(rest.restQuery).toHaveBeenCalledWith('category', {
      take: 100,
      skip: 0,
      order: { id: 'ASC' },
    })
    expect(out).toEqual(list)
  })

  it('queryCategories passes take and skip', async () => {
    vi.mocked(rest.restQuery).mockResolvedValueOnce([])
    await queryCategories({ take: 20, skip: 10 })
    expect(rest.restQuery).toHaveBeenCalledWith('category', {
      take: 20,
      skip: 10,
      order: { id: 'ASC' },
    })
  })

  it('addCategory calls restAdd with name and desc', async () => {
    const item: CategoryItem = { id: 1, name: '生活', desc: '描述' }
    vi.mocked(rest.restAdd).mockResolvedValueOnce(item)
    const out = await addCategory({ name: '生活', desc: '描述' })
    expect(rest.restAdd).toHaveBeenCalledWith('category', { name: '生活', desc: '描述' })
    expect(out).toEqual(item)
  })

  it('updateCategory calls restUpdate with id and body', async () => {
    const item: CategoryItem = { id: 1, name: '新名', desc: undefined }
    vi.mocked(rest.restUpdate).mockResolvedValueOnce(item)
    const out = await updateCategory(1, { name: '新名', desc: undefined })
    expect(rest.restUpdate).toHaveBeenCalledWith('category', 1, { name: '新名', desc: undefined })
    expect(out).toEqual(item)
  })

  it('deleteCategory calls restDel with id', async () => {
    vi.mocked(rest.restDel).mockResolvedValueOnce(undefined)
    await deleteCategory(1)
    expect(rest.restDel).toHaveBeenCalledWith('category', 1)
  })
})
