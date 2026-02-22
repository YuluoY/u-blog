<!--
  CommentInput 评论输入：富文本工具栏 + textarea / 预览切换 + 表情选择 + 字数限制 + 提交按钮。
  @see https://github.com/delowardev/vue3-emoji-picker
-->
<template>
  <div
    class="u-comment-input"
    :class="{ 'u-comment-input--compact': compact }"
  >
    <!-- 前置插槽（游客信息等），有内容时自动显示带分割线的区域 -->
    <div v-if="$slots.prepend" class="u-comment-input__prepend">
      <slot name="prepend" />
    </div>

    <!-- 工具栏 -->
    <div class="u-comment-input__toolbar">
      <!-- 文本格式组 -->
      <div class="u-comment-input__toolbar-group">
        <button
          v-for="btn in textFormatBtns"
          :key="btn.label"
          type="button"
          class="u-comment-input__toolbar-btn"
          :class="{ 'is-active': false }"
          :disabled="disabled || previewing"
          :aria-label="btn.label"
          :title="btn.label"
          @mousedown.prevent="btn.action"
        >
          <u-icon :icon="btn.icon" />
        </button>
      </div>

      <span class="u-comment-input__toolbar-divider" />

      <!-- 块级格式组 -->
      <div class="u-comment-input__toolbar-group">
        <button
          v-for="btn in blockFormatBtns"
          :key="btn.label"
          type="button"
          class="u-comment-input__toolbar-btn"
          :disabled="disabled || previewing"
          :aria-label="btn.label"
          :title="btn.label"
          @mousedown.prevent="btn.action"
        >
          <u-icon :icon="btn.icon" />
        </button>
      </div>

      <span class="u-comment-input__toolbar-divider" />

      <!-- 插入组：链接 + 分割线 + 表情 -->
      <div class="u-comment-input__toolbar-group">
        <button
          type="button"
          class="u-comment-input__toolbar-btn"
          :disabled="disabled || previewing"
          aria-label="链接"
          title="链接"
          @mousedown.prevent="insertWrap('[', '](url)')"
        >
          <u-icon icon="fa-solid fa-link" />
        </button>
        <button
          type="button"
          class="u-comment-input__toolbar-btn"
          :disabled="disabled || previewing"
          aria-label="分割线"
          title="分割线"
          @mousedown.prevent="insertLine('---')"
        >
          <u-icon icon="fa-solid fa-minus" />
        </button>
        <div ref="emojiWrapRef" class="u-comment-input__emoji-wrap">
          <button
            ref="emojiBtnRef"
            type="button"
            class="u-comment-input__toolbar-btn"
            :class="{ 'is-active': showEmoji }"
            :disabled="disabled"
            aria-label="选择表情"
            title="表情"
          >
            <u-icon icon="fa-regular fa-face-smile" />
          </button>
          <Teleport to="body" :disabled="!showEmoji">
            <div
              v-show="showEmoji"
              ref="panelRef"
              class="u-comment-input__emoji-panel u-comment-input__emoji-panel--vue3"
              :style="emojiPanelStyle"
            >
              <EmojiPicker
                :key="pickerTheme"
                :native="true"
                :theme="pickerTheme"
                @select="onSelectEmoji"
              />
            </div>
          </Teleport>
        </div>
      </div>

      <!-- 右侧：预览切换 + 发表按钮 -->
      <div class="u-comment-input__toolbar-end">
        <button
          type="button"
          class="u-comment-input__toolbar-btn"
          :class="{ 'is-active': previewing }"
          :disabled="disabled"
          aria-label="预览"
          title="预览"
          @click="previewing = !previewing"
        >
          <u-icon :icon="previewing ? 'fa-solid fa-pen-to-square' : 'fa-solid fa-eye'" />
        </button>

        <span class="u-comment-input__toolbar-divider" />

        <!-- 操作按钮嵌入工具栏右侧 -->
        <slot name="actions">
          <u-button
            v-if="compact"
            size="small"
            @click="$emit('cancel')"
          >
            取消
          </u-button>
          <u-button
            type="primary"
            size="small"
            :disabled="disabled || !trimmedValue"
            :loading="props.loading"
            @click="onSubmit"
          >
            {{ submitText }}
          </u-button>
        </slot>
      </div>
    </div>

    <!-- 编辑 / 预览区域 -->
    <div class="u-comment-input__body">
      <u-input
        v-show="!previewing"
        ref="inputRef"
        :model-value="modelValue"
        type="textarea"
        :placeholder="placeholder"
        :rows="compact ? 2 : 4"
        :max-length="maxLength"
        show-word-limit
        :disabled="disabled"
        @update:model-value="$emit('update:modelValue', typeof $event === 'string' ? $event : String($event))"
      />
      <div
        v-if="previewing"
        class="u-comment-input__preview"
        :class="{ 'u-comment-input__preview--empty': !previewHtml }"
        @click="previewing = false"
        v-html="previewHtml || placeholderPreview"
      />
    </div>

  </div>
</template>

<script setup lang="ts">
import EmojiPicker from 'vue3-emoji-picker'
import 'vue3-emoji-picker/css'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { emojify } from 'node-emoji'
import { computed, ref, nextTick, onMounted, onUnmounted, watch } from 'vue'
import type { UCommentInputEmits, UCommentInputProps } from '../types'
import { CCommentPlaceholder, CCommentSubmitText, CCommentMaxLength } from '../consts'
import { UInput } from '@/components/input'
import { UButton } from '@/components/button'
import { UIcon } from '@/components/icon'

defineOptions({
  name: 'UCommentInput'
})

const props = withDefaults(defineProps<UCommentInputProps>(), {
  placeholder: CCommentPlaceholder,
  maxLength: CCommentMaxLength,
  submitText: CCommentSubmitText,
  disabled: false,
  loading: false,
  compact: false,
  emojiPickerTheme: undefined
})
const emit = defineEmits<UCommentInputEmits>()

const inputRef = ref<{ $el?: HTMLElement } | null>(null)
const emojiWrapRef = ref<HTMLElement | null>(null)
const emojiBtnRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const showEmoji = ref(false)
const previewing = ref(false)

const emojiPanelStyle = ref<Record<string, string>>({})
let scrollEl: Element | null = null

const PANEL_HEIGHT = 320
const PANEL_GAP = 8
const VIEWPORT_EDGE = 8
const PANEL_MIN_RIGHT = 200

/* ---- 安全渲染的 markdown 允许标签 ---- */
const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 's', 'del', 'a', 'code', 'pre', 'ul', 'ol', 'li', 'blockquote', 'h1', 'h2', 'h3', 'hr']

/** 实时预览 HTML（markdown → emoji → html → sanitize） */
const previewHtml = computed(() => {
  const raw = (props.modelValue ?? '').trim()
  if (!raw) return ''
  try {
    const withEmoji = emojify(raw)
    const html = marked.parse(withEmoji) as string
    return DOMPurify.sanitize(html, { ALLOWED_TAGS })
  } catch {
    return ''
  }
})

const placeholderPreview = computed(() =>
  `<p style="color: var(--u-text-4); user-select: none;">${props.placeholder}</p>`
)

/* ---- 工具栏按钮定义 ---- */

/** 文本格式组：作用于选区，wrap 模式 */
const textFormatBtns = computed(() => [
  { label: '粗体', icon: 'fa-solid fa-bold', action: () => insertWrap('**', '**') },
  { label: '斜体', icon: 'fa-solid fa-italic', action: () => insertWrap('*', '*') },
  { label: '删除线', icon: 'fa-solid fa-strikethrough', action: () => insertWrap('~~', '~~') },
  { label: '行内代码', icon: 'fa-solid fa-code', action: () => insertWrap('`', '`') },
])

/** 块级格式组：作用于行首，line-prefix 模式 */
const blockFormatBtns = computed(() => [
  { label: '标题', icon: 'fa-solid fa-heading', action: () => insertLinePrefix('### ') },
  { label: '引用', icon: 'fa-solid fa-quote-left', action: () => insertLinePrefix('> ') },
  { label: '无序列表', icon: 'fa-solid fa-list-ul', action: () => insertLinePrefix('- ') },
  { label: '有序列表', icon: 'fa-solid fa-list-ol', action: () => insertLinePrefix('1. ') },
  { label: '代码块', icon: 'fa-solid fa-file-code', action: () => insertWrap('```\n', '\n```') },
])

/* ---- 插入逻辑 ---- */

function getTextarea(): HTMLTextAreaElement | undefined {
  const el = inputRef.value?.$el as HTMLElement | undefined
  return el?.querySelector?.('textarea') as HTMLTextAreaElement | undefined
}

/** 在光标/选区处插入 Markdown 包裹 */
function insertWrap(prefix: string, suffix: string) {
  const textarea = getTextarea()
  if (!textarea) return
  const text = props.modelValue ?? ''
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selected = text.slice(start, end)
  const newText = text.slice(0, start) + prefix + selected + suffix + text.slice(end)
  const cursorPos = selected
    ? start + prefix.length + selected.length + suffix.length
    : start + prefix.length
  emit('update:modelValue', newText)
  nextTick(() => {
    textarea.focus()
    textarea.setSelectionRange(cursorPos, cursorPos)
  })
}

/** 在当前行首插入前缀（如 ### 、> 、- ） */
function insertLinePrefix(prefix: string) {
  const textarea = getTextarea()
  if (!textarea) return
  const text = props.modelValue ?? ''
  const start = textarea.selectionStart
  // 找到当前行的行首位置
  const lineStart = text.lastIndexOf('\n', start - 1) + 1
  const newText = text.slice(0, lineStart) + prefix + text.slice(lineStart)
  const newCursor = start + prefix.length
  emit('update:modelValue', newText)
  nextTick(() => {
    textarea.focus()
    textarea.setSelectionRange(newCursor, newCursor)
  })
}

/** 插入独立一行内容（如分割线 ---） */
function insertLine(content: string) {
  const textarea = getTextarea()
  if (!textarea) return
  const text = props.modelValue ?? ''
  const start = textarea.selectionStart
  // 确保前后有换行
  const before = start > 0 && text[start - 1] !== '\n' ? '\n' : ''
  const after = '\n'
  const insert = before + content + after
  const newText = text.slice(0, start) + insert + text.slice(start)
  const newCursor = start + insert.length
  emit('update:modelValue', newText)
  nextTick(() => {
    textarea.focus()
    textarea.setSelectionRange(newCursor, newCursor)
  })
}

/* ---- 表情面板定位 ---- */

function updatePanelPosition() {
  const wrap = emojiWrapRef.value
  if (!wrap || !showEmoji.value) return
  const rect = wrap.getBoundingClientRect()
  const innerH = window.innerHeight
  const innerW = window.innerWidth
  const spaceAbove = rect.top
  const spaceBelow = innerH - rect.bottom

  const style: Record<string, string> = {
    position: 'fixed',
    left: `${Math.max(VIEWPORT_EDGE, Math.min(rect.left, innerW - PANEL_MIN_RIGHT - VIEWPORT_EDGE))}px`,
    zIndex: '10'
  }

  if (spaceAbove >= PANEL_HEIGHT + PANEL_GAP) {
    let bottom = innerH - rect.top + PANEL_GAP
    const panelTop = innerH - bottom - PANEL_HEIGHT
    if (panelTop < VIEWPORT_EDGE) bottom = innerH - PANEL_HEIGHT - VIEWPORT_EDGE
    style.bottom = `${bottom}px`
  } else if (spaceBelow >= PANEL_HEIGHT + PANEL_GAP) {
    style.top = `${rect.bottom + PANEL_GAP}px`
  } else {
    if (spaceAbove >= spaceBelow) {
      const bottom = Math.min(innerH - rect.top + PANEL_GAP, innerH - PANEL_HEIGHT - VIEWPORT_EDGE)
      style.bottom = `${Math.max(bottom, VIEWPORT_EDGE)}px`
    } else {
      const top = Math.max(rect.bottom + PANEL_GAP, VIEWPORT_EDGE)
      style.top = `${Math.min(top, innerH - PANEL_HEIGHT - VIEWPORT_EDGE)}px`
    }
  }

  emojiPanelStyle.value = style
}

const trimmedValue = computed(() => (props.modelValue ?? '').trim())

const pickerTheme = computed(() => {
  if (props.emojiPickerTheme === 'dark' || props.emojiPickerTheme === 'light') return props.emojiPickerTheme
  if (props.emojiPickerTheme === 'auto') return 'auto' as const
  if (typeof document !== 'undefined' && document.documentElement?.classList?.contains('dark')) return 'dark' as const
  return 'light' as const
})

function onSelectEmoji(emoji: { i?: string }) {
  if (emoji?.i) emit('insert', emoji.i)
  showEmoji.value = false
}

function togglePanel() {
  showEmoji.value = !showEmoji.value
}

function onClickOutside(e: MouseEvent) {
  const target = e.target as Node
  if (panelRef.value?.contains(target)) return
  if (emojiBtnRef.value?.contains(target)) {
    togglePanel()
    return
  }
  showEmoji.value = false
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
})
watch(showEmoji, (visible) => {
  if (visible) {
    nextTick(() => {
      updatePanelPosition()
      setTimeout(updatePanelPosition, 0)
      scrollEl = document.querySelector('.layout-base__main')
      scrollEl?.addEventListener('scroll', updatePanelPosition)
      window.addEventListener('resize', updatePanelPosition)
    })
  } else {
    scrollEl?.removeEventListener('scroll', updatePanelPosition)
    window.removeEventListener('resize', updatePanelPosition)
    scrollEl = null
  }
})
onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
  scrollEl?.removeEventListener('scroll', updatePanelPosition)
  window.removeEventListener('resize', updatePanelPosition)
  scrollEl = null
})

function onSubmit() {
  const content = trimmedValue.value
  if (!content || props.disabled) return
  emit('submit', content)
}
</script>

<style lang="scss">
@use '../styles/index.scss';
</style>
