import type { IActivityLog } from '../schema/activityLog'
import { CActivityType } from '../schema/activityLog'
import { faker } from '@faker-js/faker/locale/zh_CN'
import { createUser } from './user'

const ACTIVITY_TYPES = Object.values(CActivityType)

/**
 * 创建模拟行为日志
 * @returns 行为日志
 * @example
 * createActivityLog()
 */
export const createActivityLog = (): IActivityLog => {
  return {
    id: faker.number.int({ min: 1, max: 1000000 }),
    type: faker.helpers.arrayElement(ACTIVITY_TYPES),
    userId: faker.datatype.boolean() ? faker.number.int({ min: 1, max: 100 }) : null,
    user: faker.datatype.boolean() ? createUser() : null,
    sessionId: faker.string.alphanumeric(16),
    ip: faker.internet.ip(),
    location: faker.location.city(),
    browser: faker.helpers.arrayElement(['Chrome 120', 'Firefox 121', 'Safari 17', 'Edge 120']),
    device: faker.helpers.arrayElement(['Desktop', 'Mobile', 'Tablet']),
    os: faker.helpers.arrayElement(['Windows 10', 'macOS', 'Android 14', 'iOS 17', 'Linux']),
    path: faker.internet.url(),
    referer: faker.datatype.boolean() ? faker.internet.url() : null,
    metadata: null,
    duration: faker.datatype.boolean() ? faker.number.int({ min: 1000, max: 300000 }) : null,
    createdAt: faker.date.between({ from: '2024-01-01', to: new Date() }),
    updatedAt: faker.date.between({ from: '2024-01-01', to: new Date() }),
  }
}

