import type { IRole } from '../schema/role'
import { faker } from '@faker-js/faker/locale/zh_CN'
import { CUserRole } from '../schema/role'
import { createPermission } from './permission'
import { toCopy } from './utils'

/**
 * 创建角色
 * @param includePermissions 是否包含权限数据（避免循环依赖）
 * @returns 角色
 * @example
 * createRole()
 */
export const createRole = (includePermissions: boolean = true): IRole =>
{
  return {
    id: faker.number.int({ min: 1, max: 1000 }),
    name: faker.helpers.arrayElement(Object.values(CUserRole)) as any,
    desc: faker.lorem.sentence(),
    permissions: includePermissions ? toCopy(() => createPermission(false), { min: 1, max: 5 }) : undefined,
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

