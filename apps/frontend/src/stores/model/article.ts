import api from '@/api'
import { CTable, type IArticle } from '@u-blog/model'
import { useState } from '@u-blog/composables'
import { defineStore } from 'pinia'


export const useArticleStore = defineStore('article', () =>
{
  const [articleList, setArticleList] = useState<IArticle[]>([])

  const qryArticleList = async() =>
  {
    const articleList = await api(CTable.ARTICLE).getArticleList()
    setArticleList(articleList)
  }

  const findArticleById = (id: string) =>
  {
    return articleList.value.find(article => article.id === id)
  }

  onBeforeMount(() =>
  {
    qryArticleList()
  })

  return {
    articleList,
    setArticleList,
    qryArticleList,
    findArticleById
  }
})
