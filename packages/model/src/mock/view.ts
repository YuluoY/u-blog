import type { IView } from '../schema/view'
import { faker } from '@faker-js/faker/locale/zh_CN'
import { createUser } from './user'
import { createArticle } from './article'
import { createRoute } from './route'

/**
 * 创建访问记录
 * @returns 访问记录
 * @example
 * createView()
 */
export const createView = (): IView =>
{
  return {
    id: faker.number.int({ min: 1, max: 1000000 }),
    ip: faker.internet.ip(),
    agent: faker.internet.userAgent(),
    address: faker.location.city() + ' ' + faker.location.country(),
    userId: faker.helpers.arrayElement([faker.number.int({ min: 1, max: 1000000 }), undefined]),
    user: faker.helpers.arrayElement([createUser(), undefined]),
    articleId: faker.helpers.arrayElement([faker.number.int({ min: 1, max: 1000000 }), undefined]),
    article: faker.helpers.arrayElement([createArticle(), undefined]),
    routeId: faker.helpers.arrayElement([faker.number.int({ min: 1, max: 1000 }), undefined]),
    route: faker.helpers.arrayElement([createRoute(), undefined]),
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

