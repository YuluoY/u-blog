import api from '@/api'
import { CTable, type ITag } from '@u-blog/model'
import { useState } from '@u-blog/composables'
import { defineStore } from 'pinia'

export const useTagStore = defineStore('tag', () =>
{
  const [tagList, setTagList] = useState<ITag[]>([])

  const qryTagList = async() =>
  {
    const tagList = await api(CTable.TAG).getTagList()
    setTagList(tagList)
  }

  return {
    tagList,
    setTagList,
    qryTagList
  }
})
