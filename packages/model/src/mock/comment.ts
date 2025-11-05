import type { IComment } from '../schema/comment'
import { faker } from '@faker-js/faker/locale/zh_CN'
import { createArticle } from './article'
import { createUser } from './user'

/**
 * 创建评论
 * @param includeParent 是否包含父级评论（避免无限递归）
 * @returns 评论
 * @example
 * createComment()
 */
export const createComment = (includeParent: boolean = true): IComment =>
{
  return {
    id: faker.number.int({ min: 1, max: 1000000 }),
    content: faker.lorem.paragraphs(faker.number.int({ min: 1, max: 3 })),
    pid: faker.helpers.arrayElement([faker.number.int({ min: 1, max: 1000000 }), undefined]),
    parent: includeParent ? faker.helpers.arrayElement([undefined, undefined, undefined, createComment(false)]) : undefined, // 大部分没有父级，避免无限递归
    articleId: faker.helpers.arrayElement([faker.number.int({ min: 1, max: 1000000 }), undefined]),
    article: faker.helpers.arrayElement([createArticle(), undefined]),
    userId: faker.number.int({ min: 1, max: 1000000 }),
    user: createUser(),
    path: faker.internet.url(),
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
