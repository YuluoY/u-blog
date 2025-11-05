import type { IFollower } from '../schema/follower'
import { faker } from '@faker-js/faker/locale/zh_CN'
import { createUser } from './user'

/**
 * 创建粉丝关系
 * @returns 粉丝关系
 * @example
 * createFollower()
 */
export const createFollower = (): IFollower =>
{
  return {
    id: faker.number.int({ min: 1, max: 1000000 }),
    followerId: faker.number.int({ min: 1, max: 1000000 }),
    follower: createUser(),
    followingId: faker.number.int({ min: 1, max: 1000000 }),
    following: createUser(),
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

