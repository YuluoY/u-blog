import { restQuery, restUpdate } from '../../shared/api/rest'

export interface UserItem {
  id: number
  username: string
  email: string
  namec?: string | null
  avatar?: string | null
  bio?: string | null
  role?: string | null
  location?: string | null
  createdAt?: string
  updatedAt?: string
}

const MODEL = 'users'

export async function queryUsers(params: { take?: number; skip?: number } = {}) {
  return restQuery<UserItem[]>(MODEL, {
    take: params.take ?? 100,
    skip: params.skip ?? 0,
    order: { id: 'ASC' },
  })
}

export async function updateUser(
  id: number,
  body: { namec?: string; role?: string; bio?: string; avatar?: string; location?: string }
) {
  return restUpdate<UserItem>(MODEL, id, body)
}
