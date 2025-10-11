import type { Tables } from '@/types'
import article from './article'
import user from './user'
import comment from './comment'
import category from './category'
import tag from './tag'

const tableApis = {
  article,
  user,
  comment,
  category,
  tag
}

type Apis = (table: Tables) => (typeof tableApis)[Tables]

const api: Apis = table =>
{
  // 在获取对应表的接口前，这里可以做更多处理...
  return tableApis[table]
}

export default api
