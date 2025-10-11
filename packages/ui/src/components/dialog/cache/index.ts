import { DIALOG_DEF_INDEX } from '../consts'

const zIndexs: number[] = []
const zIndex = DIALOG_DEF_INDEX

export const cacheZIndex = (zIndex: number) =>
{
  if (zIndexs.includes(zIndex))
    return
  zIndexs.push(zIndex)
}

export const getMaxZIndex = () =>
{
  return zIndexs.length ? Math.max(...zIndexs) : zIndex
}

export const getZIndexs = () =>
{
  return zIndexs
}

export const getNextZIndex = () =>
{
  return zIndexs.length ? getMaxZIndex() + 1 : zIndex
}

export const isExistBiggerZIndex = (zIndex: number) =>
{
  return zIndexs.some(item => item > zIndex)
}