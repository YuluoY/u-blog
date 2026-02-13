import { defineStore } from 'pinia'
import { useState } from '@u-blog/composables'
import { getRandomImage } from '@u-blog/model'

/**
 * 顶部导航栏高度（设计稿语义：60px）。
 * 说明：
 * - 作为布局偏移、吸顶计算、预览目录定位的统一来源。
 * - 业务层用 px 语义维护，在视图层按需转 rem。
 */
export const TOP_NAV_HEIGHT_PX = 60

export const useHeaderStore = defineStore('header', () =>
{
  const [height, setHeight] = useState(TOP_NAV_HEIGHT_PX)
  const [logo, setLogo] = useState(getRandomImage())
  const [name, setName] = useState('')
  const [leftWidth, setLeftWidth] = useState(3)

  return {
    logo,
    name,
    leftWidth,
    height,

    setHeight,
    setLogo,
    setName,
    setLeftWidth
  }
})
