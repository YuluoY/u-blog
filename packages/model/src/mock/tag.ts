import type { ITag } from '../schema/tag'
import { faker } from '@faker-js/faker/locale/zh_CN'
import { createUser } from './user'

/**
 * 创建tag
 * @returns tag
 * @example
 * createTag()
 */
export const createTag = (): ITag =>
{
  return {
    id: faker.number.int({ min: 1, max: 1000000 }),
    name: faker.lorem.word(),
    desc: faker.lorem.paragraphs(3).substring(0, 500),
    userId: faker.number.int({ min: 1, max: 1000000 }),
    user: createUser(),
    color: faker.color.rgb({ format: 'css', casing: 'lower', prefix: '#' }).replace(/^#/, () =>
    {
      // 生成浅色系,将RGB值调高
      const base = '#'
      const r = Math.floor(Math.random() * 55 + 200).toString(16)
      const g = Math.floor(Math.random() * 55 + 200).toString(16)
      const b = Math.floor(Math.random() * 55 + 200).toString(16)
      return base + r + g + b
    }),
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