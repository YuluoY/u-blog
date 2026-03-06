import type { UCommentItemData } from '../types'

export interface FlattenedCommentReply {
  item: UCommentItemData
  depth: number
}

/**
 * 将某条评论下的所有回复按树展开为带深度的扁平数组。
 * depth=1 表示二级回复，depth>=2 表示更深层回复。
 */
export function flattenCommentReplies(nodes: UCommentItemData[], depth = 1): FlattenedCommentReply[] {
  if (!nodes?.length) return []
  return nodes.flatMap((node) => [
    { item: node, depth },
    ...flattenCommentReplies((node as { children?: UCommentItemData[] }).children ?? [], depth + 1),
  ])
}
