import api from '@/api'
import { CTables, type ICategory } from '@u-blog/model'
import { useState } from '@u-blog/composables'
import { defineStore } from 'pinia'

export const useCategoryStore = defineStore('category', () =>
{
  const [categoryList, setCategoryList] = useState<ICategory[]>([])

  const qryCategoryList = async() =>
  {
    const categoryList = await api(CTables.CATEGORY).getCategoryList()
    setCategoryList(categoryList)
  }

  onBeforeMount(() =>
  {
    qryCategoryList()
  })

  return {
    categoryList,
    setCategoryList,
    qryCategoryList
  }
})