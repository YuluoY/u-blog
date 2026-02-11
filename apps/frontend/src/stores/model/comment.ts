import api from '@/api'
import { CTable, type IComment } from '@u-blog/model'
import { useState } from '@u-blog/composables'
import { defineStore } from 'pinia'

export const useCommentStore = defineStore('comment', () =>
{
  const [commentList, setCommentList] = useState<IComment[]>([])

  const qryCommentList = async() =>
  {
    const commentList = await api(CTable.COMMENT).getCommentList()
    setCommentList(commentList)
  }

  onBeforeMount(() =>
  {
    qryCommentList()
  })

  return {
    commentList,
    setCommentList,
    qryCommentList
  }
})
