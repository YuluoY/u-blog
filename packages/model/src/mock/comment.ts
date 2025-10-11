import type { IComment } from '../comment'
import { faker } from '@faker-js/faker/locale/zh_CN'
import { createArticle } from './article'
import { createUser } from './user'

export const createComment = (): IComment =>
{
  return {
    id: faker.string.uuid(),
    content: faker.lorem.sentence(),
    pid: faker.string.uuid(),
    article: createArticle(),
    user: createUser(),
    createdAt: faker.date.past().toISOString().split('T')[0],
    updatedAt: faker.date.past().toISOString().split('T')[0]
  }
}