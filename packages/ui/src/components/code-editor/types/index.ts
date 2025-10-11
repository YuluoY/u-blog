import type { editor } from 'monaco-editor'
import type { UIconProps } from '../../icon/types'
import type { UTooltipProps } from '../../tooltip/types'
import { CCodeEditorShadow } from '../consts'
import type { Ref } from 'vue'

export type UCodeEditorShadow = typeof CCodeEditorShadow[keyof typeof CCodeEditorShadow];

export interface UCodeEditorProps extends editor.IStandaloneEditorConstructionOptions {
  showToolbox?: boolean
  showToolboxLabel?: boolean
  height?: number
  shadow?:UCodeEditorShadow
}

export interface UCodeEditorToolbarItem {
  name: string
  label?: string
  tooltip?: string
  icon: string
  showLabel?: boolean
  iconProps?: UIconProps
  tooltipProps?: UTooltipProps
  onClick?: (item: UCodeEditorToolbarItem) => void
}

export type UCodeEditorOptions = editor.IStandaloneEditorConstructionOptions
export type UCodeEditor = editor.IStandaloneCodeEditor | null
export type UCodeEditorChangeEvent = editor.IModelContentChangedEvent
export type UCodeEditorModel = editor.ITextModel | null
export type UCodeEditorMinimap = editor.IEditorMinimapOptions

export interface UCodeEditorEmits {
  /**
   * @description 编辑器内容变化时触发
   * @param value 编辑器内容
   */
  (e: 'update:value', value: string | undefined): void
  /**
   * @description 编辑器内容变化时触发
   * @param value 编辑器内容
   */
  (e: 'change', evt: UCodeEditorChangeEvent): void
}

export interface UCodeEditorCtx {
  editor: Ref<UCodeEditor | null>
  options: UCodeEditorOptions
}