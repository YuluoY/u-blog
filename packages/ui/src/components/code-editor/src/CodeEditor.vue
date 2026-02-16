<!--
  CodeEditor 代码编辑器：基于 Monaco，支持语言/主题/只读/高度/阴影，提供 toolbox 插槽与 provide 上下文。
-->
<template>
  <main
    :class="[
      'u-code-editor',
      `is-shadow--${shadow}`
    ]"
    :style="{ height: Height }"
  >
    <section
      ref="editorRef"
      class="u-code-editor__inner"
    />
    <slot />
    <slot name="toolbox">
      <code-editor-toolbox />
    </slot>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, provide, ref, shallowRef, toRaw } from 'vue'
import monaco from './monaco'
import type { UCodeEditor, UCodeEditorChangeEvent, UCodeEditorEmits, UCodeEditorMinimap, UCodeEditorModel, UCodeEditorProps } from '../types'
import { pxToRem } from '@u-blog/utils'
import { cloneDeep, debounce } from 'lodash-es'
import CodeEditorToolbox from '../components/CodeEditorToolbox.vue'
import { CCodeEditorCtx } from '../consts'

defineOptions({
  name: 'UCodeEditor'
})

const props = withDefaults(defineProps<UCodeEditorProps>(), {
  value: `function hello() {\n\tconsole.log('Hello, world!');\n}`,
  language: 'javascript',
  theme: 'vs-dark',
  minimap: { enabled: true } as UCodeEditorMinimap | any,
  readOnly: false,
  tabSize: 2,
  automaticLayout: false,

  shadow: 'hover',
  showToolbox: true,
  height: 400
})
const emits = defineEmits<UCodeEditorEmits>()

const CodeEditorOptions = cloneDeep(toRaw(props)) as UCodeEditorProps
const Height = computed(() => pxToRem(props.height))

const resizeObserver = ref<ResizeObserver | null>(null)
const editor = ref<UCodeEditor>(null)
const editorRef = ref(null)
const editorModel = shallowRef<UCodeEditorModel>(null)

provide(CCodeEditorCtx, {
  editor,
  options: CodeEditorOptions
})

onBeforeUnmount(() =>
{
  if (editor.value)
    editor.value.dispose()
  if (resizeObserver.value)
    resizeObserver.value.disconnect()
})

onMounted(() =>
{
  init()
})

/** 创建 Monaco 实例、绑定 model 变更与 resize */
function init()
{
  if (!editorRef.value)
    return console.error('UCodeEditor：editorRef is null')
  editor.value = monaco.editor.create(editorRef.value, toRaw(props))
  editorModel.value = editor.value.getModel()

  // 宽高变化
  handleMonitorResize()

  // 内容变化
  editor.value.onDidChangeModelContent((evt: UCodeEditorChangeEvent) =>
  {
    emits('update:value', toRaw(editorModel.value)?.getValue())
    emits('change', evt)
  })
}

function handleMonitorResize()
{
  if (editorRef.value)
  {
    resizeObserver.value = new ResizeObserver(debounce(() => onReLayout()))
    resizeObserver.value.observe(editorRef.value)
  }
}

function onReLayout()
{
  toRaw(editor.value)?.layout()
}

</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>