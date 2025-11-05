import type { ICategory } from '../schema/category'
import { faker } from '@faker-js/faker/locale/zh_CN'
import { createUser } from './user'

/**
 * 创建分类
 * @returns 分类
 * @example
 * createCategory()
 */
export const createCategory = (): ICategory =>
{
  const descLength = faker.number.int({ min: 50, max: 500 })
  const desc = faker.lorem.paragraphs(3).substring(0, descLength)

  return {
    id: faker.number.int({ min: 1, max: 1000000 }),
    name: faker.lorem.word(),
    desc: desc.length > 0 ? desc : undefined,
    userId: faker.helpers.arrayElement([faker.number.int({ min: 1, max: 1000000 }), undefined]),
    user: faker.helpers.arrayElement([createUser(), undefined]),
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