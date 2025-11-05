import type { ISetting } from '../schema/setting'
import { faker } from '@faker-js/faker/locale/zh_CN'
import { createRoute } from './route'

/**
 * 创建设置
 * @returns 设置
 * @example
 * createSetting()
 */
export const createSetting = (): ISetting =>
{
  const settingTypes = [
    { type: 'string', value: faker.lorem.word() },
    { type: 'number', value: faker.number.int({ min: 1, max: 1000 }) },
    { type: 'boolean', value: faker.datatype.boolean() },
    { type: 'object', value: { key: faker.lorem.word(), value: faker.lorem.sentence() } },
    { type: 'array', value: [faker.lorem.word(), faker.lorem.word(), faker.lorem.word()] }
  ]

  const randomType = faker.helpers.arrayElement(settingTypes)

  return {
    id: faker.number.int({ min: 1, max: 1000 }),
    key: faker.lorem.word() + '_' + faker.lorem.word(),
    value: randomType.value,
    desc: faker.lorem.sentence(),
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

