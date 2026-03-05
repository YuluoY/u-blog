/**
 * 中国省市区三级联动数据
 * 基于 @vant/area-data 转换为 UCascader 树结构
 * 使用懒加载，仅在需要时才加载数据
 */

/** 级联选项节点 */
export interface RegionOption {
  value: string | number
  label: string
  children?: RegionOption[]
}

/** 缓存：避免重复转换 */
let _cache: RegionOption[] | null = null

/**
 * 将 @vant/area-data 的扁平数据转换为 UCascader 的树结构
 * province "XY0000" → city "XYAB00" → county "XYABCD"
 */
function transform(areaList: {
  province_list: Record<string, string>
  city_list: Record<string, string>
  county_list: Record<string, string>
}): RegionOption[]
{
  const { province_list, city_list, county_list } = areaList

  return Object.entries(province_list).map(([pCode, pName]) =>
  {
    const prefix2 = pCode.slice(0, 2)
    const cities = Object.entries(city_list)
      .filter(([cCode]) => cCode.startsWith(prefix2))
      .map(([cCode, cName]) =>
      {
        const prefix4 = cCode.slice(0, 4)
        const counties = Object.entries(county_list)
          .filter(([aCode]) => aCode.startsWith(prefix4))
          .map(([aCode, aName]) => ({ value: aCode, label: aName }))
        return {
          value: cCode,
          label: cName,
          ...(counties.length > 0 ? { children: counties } : {}),
        }
      })
    return {
      value: pCode,
      label: pName,
      ...(cities.length > 0 ? { children: cities } : {}),
    }
  })
}

/**
 * 懒加载并返回中国地区树数据
 * 首次调用时 dynamic import @vant/area-data 并转换、缓存
 */
export async function loadChinaRegions(): Promise<RegionOption[]>
{
  if (_cache) return _cache
  const { areaList } = await import('@vant/area-data')
  _cache = transform(areaList)
  return _cache
}

/**
 * 根据地区编码路径查找对应的标签名称
 * @param codes 编码路径数组，如 ['110000', '110100', '110105']
 */
export function getLabelsFromCodes(
  codes: (string | number)[],
  tree: RegionOption[],
): string[]
{
  const labels: string[] = []
  let current = tree
  for (const code of codes)
  {
    const node = current.find(n => String(n.value) === String(code))
    if (!node) break
    labels.push(node.label)
    current = node.children || []
  }
  return labels
}
