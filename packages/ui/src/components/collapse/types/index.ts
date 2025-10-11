import type { Ref } from 'vue'
import type { UIconProps } from '@/components'

export interface UCollapseProps {
  modelValue?: Array<string>
  accordion?: boolean // 是否手风琴模式
}

export interface UCollapseEmits {
  (e: 'update:modelValue', value: Array<string> | undefined): void
  (e: 'change', value: Array<string> | undefined): void
}

export interface UCollapseItemProps {
  name: string              // 唯一标识
  title?: string            // 标题
  disabled?: boolean        // 是否禁用
  iconProps?: Partial<UIconProps>    // 自定义图标
}


export interface UCollapseContext {
  activeNames: Ref<string[]>
  handleItemClick: (names: string) => void
}

export interface UCollapseExposes {
  activeNames: Ref<string[]>
  updateActiveNames: (names: string[]) => void
}