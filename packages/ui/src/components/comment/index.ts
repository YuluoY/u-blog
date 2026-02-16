import Comment from './src/Comment.vue'
import CommentInput from './src/CommentInput.vue'
import CommentList from './src/CommentList.vue'
import CommentItem from './src/CommentItem.vue'
import { withInstall, type SFCWithInstall } from '@/utils'

export * from './types'
export * from './consts'

export const UComment: SFCWithInstall<typeof Comment> = withInstall<typeof Comment>(Comment)
export const UCommentInput: SFCWithInstall<typeof CommentInput> = withInstall<typeof CommentInput>(CommentInput)
export const UCommentList: SFCWithInstall<typeof CommentList> = withInstall<typeof CommentList>(CommentList)
export const UCommentItem: SFCWithInstall<typeof CommentItem> = withInstall<typeof CommentItem>(CommentItem)
