import api from '@/api'
import { CTable, type ICategory } from '@u-blog/model'
import { useState } from '@u-blog/composables'
import { defineStore } from 'pinia'

export const useCategoryStore = defineStore('category', () =>
{
  const [categoryList, setCategoryList] = useState<ICategory[]>([])

  const qryCategoryList = async() =>
  {
    const categoryList = await api(CTable.CATEGORY).getCategoryList()
    setCategoryList(categoryList)
  }

  return {
    categoryList,
    setCategoryList,
    qryCategoryList
  }
})
