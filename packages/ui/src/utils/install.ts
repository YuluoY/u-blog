import { each } from 'lodash-es'
import type { App, Plugin } from 'vue'

export type SFCWithInstall<T> = T & Plugin;

export function makeInstaller(components: Plugin[]): Plugin
{
  return ((app: App) =>
  {
    each(components, component => app.use(component))
  }) as Plugin
}

/**
 * 添加vue install方法
 * @param   component         组件
 * @param   onBeforeInstall   install前回调
 */
export function withInstall<T>(component: T, onBeforeInstall?: (app: App) => void)
{
  (component as SFCWithInstall<T>).install = (app: App) =>
  {
    if (onBeforeInstall)
    
      onBeforeInstall(app)
    
    return app.component((component as any).name, component as Plugin)
  }
  return component as SFCWithInstall<T>
}

/**
 * 添加vue的全局函数
 * @param fn   函数
 * @param name 名称
 */
export function withInstallFunc<T extends Function>(fn: T, name: string)
{
  const wrapped = function(this: any, ...args: any[])
  {
    return fn.apply(this, args)
  } as T & Plugin

  wrapped.install = (app: App) =>
  {
    app.config.globalProperties[name] = fn
  }

  // 复制原函数的所有属性
  Object.assign(wrapped, fn)
  
  return wrapped
}