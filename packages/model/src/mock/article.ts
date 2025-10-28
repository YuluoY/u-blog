import { faker } from '@faker-js/faker/locale/zh_CN'
import { generateRandomMarkdown, getRandomImage, toCopy } from './utils'
import { CArticleStatus, type IArticle } from '../schema/article'
import { createTag } from './tag'
import { createUser } from './user'
import { createCategory } from './category'

/**
 * 创建article
 * @returns article
 * @example
 * createArticle()
 */
export const createArticle = (): IArticle =>
{
  return {
    id: faker.string.uuid(),
    title: faker.lorem.sentence(),
    desc: faker.lorem.paragraphs(3).substring(0, 500),
    status: faker.helpers.arrayElement(Object.values(CArticleStatus)),
    cover: getRandomImage(),
    author: [createUser()],
    content: generateRandomMarkdown(10000, 5),
    protect: faker.helpers.arrayElement([faker.lorem.word(), '', '', '', '']),
    commentCount: faker.number.int({ min: 1, max: 100 }),
    user: createUser(),
    category: createCategory(),
    isPrivate: faker.helpers.arrayElement([true, false]),
    isTop: faker.helpers.arrayElement([true, false]),
    tags: toCopy(createTag()),
    viewCount: faker.number.int({ min: 1, max: 1000 }),
    likeCount: faker.number.int({ min: 1, max: 100 }),
    createdAt: faker.date
      .between({
        from: '2020-01-01',
        to: new Date()
      })
      .toISOString()
      .split('T')[0],
    updatedAt: faker.date
      .between({
        from: '2020-01-01',
        to: new Date()
      })
      .toISOString()
      .split('T')[0],
    publishedAt: faker.date
      .between({
        from: '2020-01-01',
        to: new Date()
      })
      .toISOString()
      .split('T')[0]
  }
}
