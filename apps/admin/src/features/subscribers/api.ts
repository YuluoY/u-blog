import { restQuery, restDel } from '../../shared/api/rest'

export interface SubscriberItem {
  id: number
  email: string
  name?: string | null
  status: 'pending' | 'active' | 'unsubscribed'
  createdAt?: string
  updatedAt?: string
}

const MODEL = 'subscriber'

export async function querySubscribers(params: { take?: number; skip?: number } = {}) {
  return restQuery<SubscriberItem[]>(MODEL, {
    take: params.take ?? 500,
    skip: params.skip ?? 0,
    order: { id: 'DESC' },
  })
}

export async function deleteSubscriber(id: number) {
  return restDel(MODEL, id)
}
