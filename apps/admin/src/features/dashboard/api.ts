import { restQuery } from '../../shared/api/rest'

export interface DashboardStats {
  articles: number
  users: number
  comments: number
}

async function fetchStats(): Promise<DashboardStats> {
  const [articlesRes, usersRes, commentsRes] = await Promise.all([
    restQuery<unknown[]>('article', { take: 10000 }),
    restQuery<unknown[]>('users', { take: 10000 }),
    restQuery<unknown[]>('comment', { take: 10000 }),
  ])
  return {
    articles: Array.isArray(articlesRes) ? articlesRes.length : 0,
    users: Array.isArray(usersRes) ? usersRes.length : 0,
    comments: Array.isArray(commentsRes) ? commentsRes.length : 0,
  }
}

export { fetchStats }
