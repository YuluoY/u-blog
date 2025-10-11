import { withInstall, type SFCWithInstall } from '@/utils' 
import Table from './src/Table.vue'


export * from './types'

export const UTable: SFCWithInstall<typeof Table> = withInstall<typeof Table>(Table)
