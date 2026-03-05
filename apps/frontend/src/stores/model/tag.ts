import api from '@/api'
import { CTable, type ITag } from '@u-blog/model'
import { useState } from '@u-blog/composables'
import { defineStore } from 'pinia'

export const useTagStore = defineStore('tag', () =>
{
  const [tagList, setTagList] = useState<ITag[]>([])
  /** 是否已加载过，防止多处同时调用导致重复请求 */
  const [loaded, setLoaded] = useState(false)
  /** 并发去重：缓存进行中的 Promise */
  let _fetchPromise: Promise<void> | null = null

  const qryTagList = async(force = false) =>
  {
    if (loaded.value && !force) return
    if (_fetchPromise) return _fetchPromise
    _fetchPromise = (async() =>
    {
      try
      {
        const list = await api(CTable.TAG).getTagList()
        setTagList(list)
        setLoaded(true)
      }
      finally
      {
        _fetchPromise = null
      }
    })()
    return _fetchPromise
  }

  return {
    tagList,
    loaded,
    setTagList,
    qryTagList
  }
})
