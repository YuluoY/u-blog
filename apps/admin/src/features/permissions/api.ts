import { restQuery, restAdd, restUpdate, restDel } from '../../shared/api/rest'

/** 权限项 */
export interface PermissionItem {
  id: number
  name: string
  code: string
  desc?: string | null
  type: string
  resource?: string | null
  action: string
  createdAt?: string
  updatedAt?: string
}

const MODEL = 'permission'

/** 查询权限列表 */
export async function queryPermissions(params: { take?: number; skip?: number } = {}) {
  return restQuery<PermissionItem[]>(MODEL, {
    take: params.take ?? 500,
    skip: params.skip ?? 0,
    order: { id: 'ASC' },
  })
}

/** 新增权限 */
export async function addPermission(body: Partial<PermissionItem>) {
  return restAdd<PermissionItem>(MODEL, body as Record<string, unknown>)
}

/** 更新权限 */
export async function updatePermission(id: number, body: Partial<PermissionItem>) {
  return restUpdate<PermissionItem>(MODEL, id, body as Record<string, unknown>)
}

/** 删除权限 */
export async function deletePermission(id: number) {
  return restDel(MODEL, id)
}
