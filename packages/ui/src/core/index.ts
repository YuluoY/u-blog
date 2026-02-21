import components from './components'
import { makeInstaller } from '@/utils'
import '@/theme/index.scss'

import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'

library.add(fas, far, fab)

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
