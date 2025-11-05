import type { ILike } from '../schema/like'
import { faker } from '@faker-js/faker/locale/zh_CN'
import { createUser } from './user'
import { createArticle } from './article'
import { createComment } from './comment'

/**
 * 创建点赞
 * @returns 点赞
 * @example
 * createLike()
 */
export const createLike = (): ILike =>
{
  // 根据业务逻辑，articleId 和 commentId 必须有一个不为空
  const likeType = faker.helpers.arrayElement(['article', 'comment'])

  return {
    id: faker.number.int({ min: 1, max: 1000000 }),
    userId: faker.number.int({ min: 1, max: 1000000 }),
    user: createUser(),
    articleId: likeType === 'article' ? faker.number.int({ min: 1, max: 1000000 }) : undefined,
    article: likeType === 'article' ? createArticle() : undefined,
    commentId: likeType === 'comment' ? faker.number.int({ min: 1, max: 1000000 }) : undefined,
    comment: likeType === 'comment' ? createComment() : undefined,
    createdAt: faker.date.between({
      from: '2020-01-01',
      to: new Date()
    }),
    updatedAt: faker.date.between({
      from: '2020-01-01',
      to: new Date()
    })
  }
}

