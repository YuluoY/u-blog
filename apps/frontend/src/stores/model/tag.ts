import api from '@/api'
import { CTables, type ITag } from '@u-blog/model'
import { useState } from '@u-blog/composables'
import { defineStore } from 'pinia'

export const useTagStore = defineStore('tag', () =>
{
  const [tagList, setTagList] = useState<ITag[]>([])

  const qryTagList = async() =>
  {
    const tagList = await api(CTables.TAG).getTagList()
    setTagList(tagList)
  }

  onBeforeMount(() =>
  {
    qryTagList()
  })

  return {
    tagList,
    setTagList,
    qryTagList
  }
})