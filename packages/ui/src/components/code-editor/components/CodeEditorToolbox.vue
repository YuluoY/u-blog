<!--
  CodeEditorToolbox 代码编辑器工具栏：字体缩放、只读切换等，依赖 CodeEditor 的 provide 上下文。
-->
<template>
  <section class="u-code-editor__toolbox">
    <div
      v-for="(item, index) in toolbox"
      :key="index"
      class="u-code-editor__toolbox-item"
      @click="_ => isFunction(item.onClick) && item.onClick(item)"
    >
      <u-tooltip
        v-if="!item.showLabel"
        class="content"
        :visible="false"
        placement="top"
        :content="item.tooltip ?? item.label"
        effect="light"
        :width="50"
        v-bind="item.tooltipProps ?? void 0"
      >
        <u-icon
          :icon="item.icon"
          v-bind="item.iconProps ?? void 0"
        />
      </u-tooltip>
      <div
        v-else
        class="content"
      >
        <u-icon
          :icon="item.icon"
          v-bind="item.iconProps ?? void 0"
        />
        <span
          v-show="item.showLabel ?? false"
          class="u-code-editor__toolbox-item-label"
        >{{ item.label }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { inject, reactive } from 'vue'
import { rootFontSize } from '@u-blog/utils'
import { UIcon } from '@/components/icon'
import { UTooltip } from '@/components/tooltip'
import { useLocale } from '@/components/config-provider'
import { isFunction } from 'lodash-es'
import type { UCodeEditorCtx, UCodeEditorToolbarItem } from '../types'
import { CCodeEditorToolbox as Toolbox, CCodeEditorCtx } from '../consts' 

const {
  editor,
  options
} = inject(CCodeEditorCtx) as UCodeEditorCtx

const { t } = useLocale()
const toolbox = reactive<UCodeEditorToolbarItem[]>([
  { name: Toolbox.IncrementFontSize, label: t('codeEditor.increaseFontSize'), icon: 'fa-plus', onClick: onIncrementFontSize },
  { name: Toolbox.DecrementFontSize, label: t('codeEditor.decreaseFontSize'), icon: 'fa-minus', onClick: onDecrementFontSize },
  { name: Toolbox.ResetFontSize, label: t('codeEditor.resetFontSize'), icon: 'fa-undo', onClick: onResetFontSize },
  { name: Toolbox.Fomatter, label: t('codeEditor.format'), icon: 'fa-code', onClick: onFormatter },
  { name: Toolbox.ToggleMinimap, label: t('codeEditor.minimap'), icon: 'fa-compress', onClick: onToggleMinimap }
])

function onIncrementFontSize()
{
  options.fontSize! += 1
  editor.value?.updateOptions({ fontSize: options.fontSize })
}

function onDecrementFontSize()
{
  options.fontSize! -= 1
  editor.value?.updateOptions({ fontSize: options.fontSize })
}

function onResetFontSize()
{
  options.fontSize = rootFontSize.value
  editor.value?.updateOptions({ fontSize: options.fontSize })
}

function onFormatter()
{
  editor.value?.getAction('editor.action.formatDocument')?.run()
}

function onToggleMinimap()
{
  (options.minimap!).enabled = !((options.minimap!).enabled)
  editor.value?.updateOptions({ minimap: options.minimap })
}

function onToggleReadOnly()
{
  options.readOnly = !options.readOnly
  editor.value?.updateOptions({ readOnly: options.readOnly })
}

function onToggleWordWrap()
{
  options.wordWrap = options.wordWrap === 'off' ? 'on' : 'off'
}

defineExpose({
  onToggleReadOnly,
  onToggleWordWrap
})

</script>