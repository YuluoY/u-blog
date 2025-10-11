import type { ITag } from '../tag'
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
    id: faker.string.uuid(),
    name: faker.lorem.word(),
    desc: faker.lorem.paragraphs(3).substring(0, 500),
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
    createdAt: faker.date
      .past()
      .toISOString()
      .split('T')[0],
    updatedAt: faker.date
      .past()
      .toISOString()
      .split('T')[0]
  }
}