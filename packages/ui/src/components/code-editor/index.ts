import { withInstall, type SFCWithInstall } from '@/utils'
import CodeEditor from './src/CodeEditor.vue'

export * from './types'
export * from './consts'

export const UCodeEditor: SFCWithInstall<typeof CodeEditor> = withInstall<typeof CodeEditor>(CodeEditor)