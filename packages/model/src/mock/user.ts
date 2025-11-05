import type { IUserSocial, IUser, IUserWebsite } from '../schema/user'
import { faker } from '@faker-js/faker/locale/zh_CN'
import { CUserRole } from '../schema/role'
import { getRandomImage, toCopy } from './utils'

/**
 * 创建用户
 * @returns 用户
 * @example
 * createUser()
 */
export const createUser = (): IUser =>
{
  return {
    id: faker.number.int({ min: 1, max: 1000000 }),
    username: faker.internet.userName(),
    password: faker.internet.password({ length: 12 }),
    email: faker.internet.email(),
    namec: faker.person.fullName(),
    avatar: getRandomImage(),
    bio: faker.lorem.sentence(),
    role: faker.helpers.arrayElement(Object.values(CUserRole)) as any,
    location: faker.location.city(),
    ip: faker.internet.ip(),
    website: createWebsite(),
    socials: toCopy(createSocial, { min: 1, max: 5 }),
    isActive: faker.datatype.boolean(),
    token: faker.helpers.arrayElement([faker.string.alphanumeric(32), undefined]),
    failLoginCount: faker.number.int({ min: 0, max: 5 }),
    lockoutExpiresAt: faker.helpers.arrayElement([
      faker.date.future(),
      undefined
    ]),
    lastLoginAt: faker.date.between({
      from: '2020-01-01',
      to: new Date()
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

/**
 * 创建website
 * @returns website
 * @example
 * createWebsite()
 */
export const createWebsite = (): IUserWebsite =>
{
  return {
    url: faker.internet.url(),
    title: faker.lorem.sentence(),
    desc: faker.lorem.paragraphs(3).substring(0, 500),
    cover: getRandomImage()
  }
}

/**
 * 创建社交账号
 * @returns 社交账号
 * @example
 * createSocial()
 */
export const createSocial = (): IUserSocial =>
{
  const socialPlatforms = ['github', 'twitter', 'facebook', 'linkedin', 'instagram', 'weibo', 'zhihu', 'bilibili']
  const platform = faker.helpers.arrayElement(socialPlatforms)
  
  return {
    name: platform,
    icon: getRandomImage(),
    url: faker.internet.url({ protocol: 'https' })
  }
}
  