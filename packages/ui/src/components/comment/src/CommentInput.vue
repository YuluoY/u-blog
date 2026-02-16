<!--
  CommentInput 评论输入：textarea + 表情选择（vue3-emoji-picker） + 字数限制 + 提交按钮。
  @see https://github.com/delowardev/vue3-emoji-picker
-->
<template>
  <div
    ref="rootRef"
    class="u-comment-input"
    :class="{ 'u-comment-input--compact': compact }"
  >
    <slot name="prepend" />
    <div class="u-comment-input__toolbar">
      <div ref="emojiWrapRef" class="u-comment-input__emoji-wrap">
        <button
          ref="emojiBtnRef"
          type="button"
          class="u-comment-input__emoji-btn"
          :class="{ 'is-open': showEmoji }"
          :disabled="disabled"
          aria-label="选择表情"
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
    <u-input
      :model-value="modelValue"
      type="textarea"
      :placeholder="placeholder"
      :rows="compact ? 2 : 4"
      :max-length="maxLength"
      show-word-limit
      :disabled="disabled"
      @update:model-value="$emit('update:modelValue', typeof $event === 'string' ? $event : String($event))"
    />
    <div class="u-comment-input__actions">
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
          :size="compact ? 'small' : 'default'"
          :disabled="disabled || !trimmedValue"
          :loading="props.loading"
          @click="onSubmit"
        >
          {{ submitText }}
        </u-button>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import EmojiPicker from 'vue3-emoji-picker'
import 'vue3-emoji-picker/css'
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

const rootRef = ref<HTMLElement | null>(null)
const emojiWrapRef = ref<HTMLElement | null>(null)
const emojiBtnRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const showEmoji = ref(false)

const emojiPanelStyle = ref<Record<string, string>>({})
let scrollEl: Element | null = null

const PANEL_HEIGHT = 320
const PANEL_GAP = 8
const VIEWPORT_EDGE = 8
const PANEL_MIN_RIGHT = 200

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

/** 工具栏表情图标点击：切换面板显隐 */
function togglePanel() {
  showEmoji.value = !showEmoji.value
}

/** 点击不在面板上则关闭；点击在工具栏表情图标上由 togglePanel 处理显隐 */
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
