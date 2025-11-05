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
  const descLength = faker.number.int({ min: 50, max: 500 })
  const desc = faker.lorem.paragraphs(3).substring(0, descLength)
  const publishedAt = faker.date.between({
    from: '2020-01-01',
    to: new Date()
  })

  return {
    userId: faker.number.int({ min: 1, max: 1000000 }),
    user: createUser(),
    
    categoryId: faker.helpers.arrayElement([faker.number.int({ min: 1, max: 1000000 }), undefined]),
    category: faker.helpers.arrayElement([createCategory(), undefined]),

    tags: toCopy(createTag, { min: 1, max: 5 }),

    id: faker.number.int({ min: 1, max: 1000000 }),
    title: faker.lorem.sentence(),
    desc: desc.length > 0 ? desc : undefined,
    status: faker.helpers.arrayElement(Object.values(CArticleStatus)),
    cover: faker.helpers.arrayElement([getRandomImage(), undefined]),
    content: generateRandomMarkdown(10000, 5),
    protect: faker.helpers.arrayElement([faker.lorem.word(), undefined, undefined, undefined]),
    commentCount: faker.number.int({ min: 0, max: 100 }),
    isPrivate: faker.datatype.boolean(),
    isTop: faker.datatype.boolean(),
    viewCount: faker.number.int({ min: 0, max: 10000 }),
    likeCount: faker.number.int({ min: 0, max: 1000 }),
    publishedAt,
    createdAt: faker.date.between({
      from: '2020-01-01',
      to: publishedAt
    }),
    updatedAt: faker.date.between({
      from: publishedAt,
      to: new Date()
    })
  }
}
