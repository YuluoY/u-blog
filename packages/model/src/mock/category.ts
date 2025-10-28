import type { ICategory } from '../schema/category'
import { faker } from '@faker-js/faker/locale/zh_CN'
import { createUser } from './user'

export const createCategory = (): ICategory =>
{
  return {
    id: faker.string.uuid(),
    name: faker.lorem.word(),
    desc: faker.lorem.paragraphs(3).substring(0, 500),
    user: createUser(),
    createdAt: faker.date.past().toISOString().split('T')[0],
    updatedAt: faker.date.past().toISOString().split('T')[0]
  }
}