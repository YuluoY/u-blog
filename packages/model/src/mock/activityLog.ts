import type { IActivityLog } from '../schema/activityLog'
import { faker } from '@faker-js/faker/locale/zh_CN'
import { createUser } from './user'

/**
 * 创建操作日志
 * @returns 操作日志
 * @example
 * createActivityLog()
 */
export const createActivityLog = (): IActivityLog =>
{
  const actions = [
    '登录',
    '登出',
    '创建文章',
    '更新文章',
    '删除文章',
    '创建评论',
    '删除评论',
    '点赞文章',
    '取消点赞',
    '关注用户',
    '取消关注',
    '上传文件',
    '删除文件',
    '修改设置',
    '查看文章',
    '搜索文章'
  ]

  return {
    id: faker.number.int({ min: 1, max: 1000000 }),
    userId: faker.number.int({ min: 1, max: 1000000 }),
    user: createUser(),
    action: faker.helpers.arrayElement(actions),
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

