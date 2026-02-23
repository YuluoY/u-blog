import { restQuery, restAdd, restUpdate, restDel } from '../../shared/api/rest'

/** 权限项（嵌套在角色中） */
export interface PermissionItem {
  id: number
  name: string
  code: string
  desc?: string | null
  type: string
  resource?: string | null
  action: string
}

/** 角色项 */
export interface RoleItem {
  id: number
  name: string
  desc: string
  permissions?: PermissionItem[]
  createdAt?: string
  updatedAt?: string
}

const MODEL = 'role'

/** 查询角色列表（关联权限） */
export async function queryRoles(params: { take?: number; skip?: number } = {}) {
  return restQuery<RoleItem[]>(MODEL, {
    take: params.take ?? 100,
    skip: params.skip ?? 0,
    order: { id: 'ASC' },
    relations: ['permissions'],
  })
}

/** 新增角色 */
export async function addRole(body: { name: string; desc: string; permissions?: { id: number }[] }) {
  return restAdd<RoleItem>(MODEL, body as Record<string, unknown>)
}

/** 更新角色 */
export async function updateRole(id: number, body: { name?: string; desc?: string; permissions?: { id: number }[] }) {
  return restUpdate<RoleItem>(MODEL, id, body as Record<string, unknown>)
}

/** 删除角色 */
export async function deleteRole(id: number) {
  return restDel(MODEL, id)
}
