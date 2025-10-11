import type { App } from 'vue'
import { CLanguage, CTheme } from '@u-blog/model'
import { useRootFontSize } from '@u-blog/helper'
import { useAppStore } from './stores/app'

export default async function beforehand(app: App): Promise<void>
{

  const appStore = useAppStore()
  /**
   * 设置根字体大小
   */
  useRootFontSize({
    rootFontSize: appStore.rootFontSize,
    beforeRefreshCallback: size => appStore.setRootFontSize(size!),
    immediate: true
  })

  /**
   * 设置主题
   */
  appStore.setTheme(CTheme.DEFAULT)
  /**
   * 设置语言
   */
  appStore.setLanguage(CLanguage.ZH)
}
