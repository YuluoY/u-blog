import { describe, expect, it } from 'vitest'
import { flattenCommentReplies } from '../src/utils'
import type { UCommentItemData } from '../types'

function createComment(id: number, overrides: Partial<UCommentItemData> = {}): UCommentItemData {
  return {
    id,
    userId: 1,
    content: `comment-${id}`,
    path: '/read/1',
    ...overrides,
  }
}

describe('comment utils', () => {
  it('保留二三级回复的真实深度', () => {
    const level3 = createComment(3, { pid: 2, children: [] })
    const level2 = createComment(2, { pid: 1, children: [level3] })
    const root = createComment(1, { children: [level2] })

    const flattened = flattenCommentReplies(root.children ?? [])

    expect(flattened).toHaveLength(2)
    expect(flattened[0]).toMatchObject({ item: level2, depth: 1 })
    expect(flattened[1]).toMatchObject({ item: level3, depth: 2 })
  })

  it('空回复树返回空数组', () => {
    expect(flattenCommentReplies([])).toEqual([])
  })
})
