import type { IRoute } from '../schema/route'
import { faker } from '@faker-js/faker/locale/zh_CN'

/**
 * 创建路由
 * @param includeParent 是否包含父级路由（避免无限递归）
 * @returns 路由
 * @example
 * createRoute()
 */
export const createRoute = (includeParent: boolean = true): IRoute =>
{
  const routeNames = ['home', 'about', 'archive', 'message', 'read', 'admin', 'profile', 'settings']
  const routePaths = ['/home', '/about', '/archive', '/message', '/read/:id', '/admin', '/profile', '/settings']
  const routeComponents = ['HomeView', 'AboutView', 'ArchiveView', 'MessageView', 'ReadView', 'AdminView', 'ProfileView', 'SettingsView']
  const icons = ['fa-home', 'fa-info', 'fa-archive', 'fa-comment', 'fa-book', 'fa-cog', 'fa-user', 'fa-settings']

  const index = faker.number.int({ min: 0, max: routeNames.length - 1 })

  return {
    id: faker.number.int({ min: 1, max: 1000 }),
    title: faker.lorem.words(2),
    name: routeNames[index] + '_' + faker.number.int({ min: 1, max: 100 }),
    path: routePaths[index],
    component: routeComponents[index],
    redirect: faker.helpers.arrayElement([faker.helpers.arrayElement(routePaths), undefined]),
    icon: icons[index],
    isKeepAlive: faker.datatype.boolean(),
    isAffix: faker.datatype.boolean(),
    isExact: faker.datatype.boolean(),
    isProtected: faker.datatype.boolean(),
    isHero: faker.datatype.boolean(),
    isLeftSide: faker.datatype.boolean(),
    isRightSide: faker.datatype.boolean(),
    pid: faker.helpers.arrayElement([faker.number.int({ min: 1, max: 1000 }), undefined]),
    parent: includeParent ? faker.helpers.arrayElement([undefined, undefined, undefined, createRoute(false)]) : undefined, // 大部分没有父级，避免无限递归
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

