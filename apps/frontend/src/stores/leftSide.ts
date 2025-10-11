import type { IArticle } from '@/types/models/article'
import { useState } from '@u-blog/composables'
import { defineStore, storeToRefs } from 'pinia'
import { watch } from 'vue'
import { useUserStore } from './model/user'
import { useArticleStore } from './model/article'


export const useLeftSideStore = defineStore('leftSide', () =>
{
  const { user } = storeToRefs(useUserStore())
  const { articleList } = storeToRefs(useArticleStore())
  const [latestArticleList, setLatestArticleList] = useState<IArticle[]>([])
  const [latestNum, setLatestNum] = useState<number>(5)

  watch(() => [articleList.value.length, articleList.value], () =>
  {
    if (!articleList.value.length)
      return
  
    const sortedArticleList = articleList.value.toSorted((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    setLatestArticleList(articleList.value.length <= latestNum.value ? sortedArticleList : sortedArticleList.slice(0, latestNum.value))
  }, {
    immediate: true,
    flush: 'post'
  })


  return {
    latestArticleList,
    user,
    latestNum,
    setLatestArticleList,
    setLatestNum
  }
})