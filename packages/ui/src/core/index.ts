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
export * from '@/locale'
export default install