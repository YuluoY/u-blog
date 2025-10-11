import { cloneDeep } from 'lodash-es';
export interface ArrayToTreeOptions {
  fld?: string // 关联字段
  glFld?: string // 子关联字段
  childFld?: string // 子节点字段
  isJudgeType?: boolean // 是否判断类型
  isChangeOwner?: boolean // 是否改变自己
}

/**
 * 扁平路由表转换有层级的路由表
 * @author      Yuluo
 * @link        https://github.com/YuluoY
 * @date        2024-08-29
 * @param       {T}                             routes                        需要转换的路由表
 * @param       {ArrayToTreeOptions}   opts                          配置项
 * @param       {string}                        [opts.fld= 'id']              路由表中的id字段名，默认为id
 * @param       {string}                        [opts.glFld= 'parentId']      路由表中的父级id字段名，默认为parentId
 * @param       {string}                        [opts.childFld= 'children']   路由表中的子级字段名，默认为children
 * @param       {boolean}                       [opts.isJudgeType= true]      是否判断类型，默认为true
 * @param       {boolean}                       [opts.isChangeOwner= true]    是否改变原数组，默认为true
 * @returns     {T}                                                           返回转换后的路由表
 * @example
 * ```ts
 *   const routes = [
 *     { id: 1, pid: 0, name: 'home' },
 *     { id: 2, pid: 1, name: 'home1' },
 *     { id: 3, pid: 1, name: 'home2' },
 *     { id: 4, pid: 2, name: 'home3' },
 *   ]
 *   const result = arrayToTree(routes, { fld: 'id', glFld: 'pid', childFld: 'children' })
 *   // [
 *    {
 *      id: 1,
 *      pid: 0,
 *      name: 'home',
 *      children: [
 *         {
 *            id: 2,
 *            pid: 1,
 *            name: 'home1',
 *            children: [
 *              { id: 4, pid: 2, name: 'home3' }
 *            ]
 *         },
 *        { id: 3, pid: 1, name: 'home2' }
 *      ]
 *     }
 *   ]
 * ```
 */
export const arrayToTree = <T = any>(routes: T[], opts: ArrayToTreeOptions = {}): T[] =>
{
  const { fld = 'id', glFld = 'parentId', childFld = 'children', isJudgeType = true, isChangeOwner = true } = opts
  const newRoutes: T[] = isChangeOwner ? routes : cloneDeep(routes)
  for (const route of newRoutes as T[] | any[])
  {
    if (route[glFld])
    {
      const parent: T | any = isJudgeType
        ? newRoutes.find((item: T | any) => item[fld] && item[fld] === route[glFld])
        : newRoutes.find((item: T | any) => item[fld] && item[fld] == route[glFld])
      if (!parent) continue
      ;(parent[childFld] = parent[childFld] || []).push(route)
    }
  }
  return routes.filter((route: T | any) => !route[glFld]) as T[]
}