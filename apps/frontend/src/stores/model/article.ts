import api from '@/api'
import { CTable, type IArticle } from '@u-blog/model'
import { useState } from '@u-blog/composables'
import { defineStore } from 'pinia'


export const useArticleStore = defineStore('article', () =>
{
  const [articleList, setArticleList] = useState<IArticle[]>([])
  const [currentArticle, setCurrentArticle] = useState<IArticle | null>(null)

  const qryArticleList = async() =>
  {
    const articleList = await api(CTable.ARTICLE).getArticleList()
    setArticleList(articleList)
  }

  const qryArticleById = async(id: string) =>
  {
    const article = await api(CTable.ARTICLE).getArticleById(id)
    setCurrentArticle(article)
    return article
  }

  const findArticleById = (id: string) =>
  {
    return articleList.value.find(article => article.id === id || article.id === parseInt(id))
  }

  onBeforeMount(() =>
  {
    qryArticleList()
  })

  return {
    articleList,
    currentArticle,
    setArticleList,
    setCurrentArticle,
    qryArticleList,
    qryArticleById,
    findArticleById
  }
})
