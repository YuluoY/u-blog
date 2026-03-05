import components from './components'
import { makeInstaller } from '@/utils'
// 主题 CSS 不再由库自身 side-effect 导入，改由消费方按需引入 base.css
// FontAwesome 图标注册同样由消费方按需完成

const install = makeInstaller(components.map((v: any) => ({ ...v, name: v.name?.startsWith('U') ? v.name : `U${v.name}` })) as any)

export * from '@/components'
/** 显式从子包再导出，避免 barrel 被 tree-shake 后打包缺失 */
export { USelect } from '@/components/select'
export { UCascader } from '@/components/cascader'
export { UMonthPicker } from '@/components/month-picker'
export { UCalendarGrid } from '@/components/calendar-grid'
export { UText } from '@/components/text'
export * from '@/locale'
export default install
