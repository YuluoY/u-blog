import type { IPermission } from '../schema/permission'
import { faker } from '@faker-js/faker/locale/zh_CN'
import { CPermission, CPermissionAction } from '../schema/permission'
import { createRole } from './role'
import { toCopy } from './utils'

/**
 * 创建权限
 * @param includeRoles 是否包含角色数据（避免循环依赖）
 * @returns 权限
 * @example
 * createPermission()
 */
export const createPermission = (includeRoles: boolean = true): IPermission =>
{
  const permissionTypes = Object.values(CPermission)
  const actions = Object.values(CPermissionAction)
  const resources = ['user', 'article', 'comment', 'tag', 'category', 'media', 'route', 'setting']

  const type = faker.helpers.arrayElement(permissionTypes)
  const action = faker.helpers.arrayElement(actions)
  const resource = faker.helpers.arrayElement(resources)

  return {
    id: faker.number.int({ min: 1, max: 1000 }),
    name: `${resource}_${action}`,
    code: `${resource}:${action}`,
    desc: faker.lorem.sentence(),
    type: type as any,
    resource: faker.helpers.arrayElement([resource, undefined]),
    action: action as any,
    roles: includeRoles ? toCopy(() => createRole(false), { min: 0, max: 3 }) : undefined,
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

