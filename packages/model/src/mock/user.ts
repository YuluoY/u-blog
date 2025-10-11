import type { IUserSocial, IUser, IUserWebsite } from '../user'
import { faker } from '@faker-js/faker/locale/zh_CN'
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
    id: faker.string.uuid(),
    username: faker.internet.userName(),
    email: faker.internet.email(),
    namec: faker.person.fullName(),
    avatar: getRandomImage(),
    bio: faker.lorem.sentence(),
    role: 'user',
    location: faker.location.city(),
    ip: faker.internet.ip(),
    website: createWebsite(),
    socials: toCopy(createSocial, { min: 1, max: 5 }),
    isActive: true,
    isVerified: true,
    token: faker.string.alphanumeric(),
    lastLoginAt: faker.date.past().toISOString().split('T')[0],
    createdAt: faker.date.past().toISOString().split('T')[0],
    updatedAt: faker.date.past().toISOString().split('T')[0]
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

export const createSocial = (): IUserSocial =>
{
  return {
    type: faker.helpers.arrayElement(['github', 'twitter', 'facebook', 'linkedin', 'instagram']),
    logo: getRandomImage(),
    url: faker.internet.url()
  }
}
  