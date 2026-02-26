<template>
  <!--
    移动端目录底部抽屉
    仅在 ≤992px（平板及以下）的阅读页可用，
    由 MobileBottomNav 的"目录"按钮触发打开。
    点击目录项后自动关闭抽屉，滚动到对应位置。
  -->
  <Teleport to="body">
    <!-- 遮罩层 -->
    <Transition name="toc-sheet-fade">
      <div
        v-if="visible"
        class="toc-sheet-backdrop"
        @click="close"
      />
    </Transition>

    <!-- 抽屉面板 -->
    <Transition name="toc-sheet-slide">
      <div
        v-if="visible"
        class="toc-sheet"
        role="dialog"
        :aria-label="t('read.catalog')"
      >
        <!-- 顶部拖拽条 + 标题 -->
        <div class="toc-sheet__header">
          <div class="toc-sheet__drag-bar" />
          <span class="toc-sheet__title">{{ t('read.catalog') }}</span>
          <button class="toc-sheet__close" @click="close" :aria-label="t('common.close')">
            <u-icon icon="fa-solid fa-xmark" />
          </button>
        </div>

        <!-- 目录内容 -->
        <div class="toc-sheet__body" @click.capture="handleCatalogClick">
          <component
            v-if="tocCtx.Catalog.value"
            :is="tocCtx.Catalog.value"
            :scroll-element="tocCtx.scrollElement.value"
          />
          <p v-else class="toc-sheet__empty">{{ t('read.noToc') }}</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useMobileToc } from '@/composables/useMobileToc'

defineOptions({ name: 'MobileTocSheet' })

const { t } = useI18n({ useScope: 'global' })
const tocCtx = useMobileToc()

/** 从全局响应式状态控制显隐 */
const visible = computed(() => tocCtx.sheetVisible.value)

/** 关闭抽屉 */
function close() {
  tocCtx.sheetVisible.value = false
}

/**
 * 点击目录项后自动关闭抽屉
 * MdCatalog 使用 div.md-editor-catalog-link > span 结构
 */
function handleCatalogClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (target.closest('.md-editor-catalog-link')) {
    // 延迟关闭，让滚动动画先触发
    setTimeout(close, 200)
  }
}
</script>

<style lang="scss" scoped>
/* ---- 遮罩层 ---- */
.toc-sheet-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10010;
  background: rgba(0, 0, 0, 0.35);
  -webkit-tap-highlight-color: transparent;
}

/* ---- 抽屉面板 ---- */
.toc-sheet {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10011;
  max-height: 60vh;
  display: flex;
  flex-direction: column;
  background: var(--u-background-1);
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -4px 32px rgba(0, 0, 0, 0.12);
  /* 安全区底部留白 */
  padding-bottom: env(safe-area-inset-bottom, 0);
  box-sizing: border-box;

  &__header {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    padding: 12px 16px 8px;
    flex-shrink: 0;
  }

  &__drag-bar {
    position: absolute;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    width: 36px;
    height: 4px;
    border-radius: 2px;
    background: var(--u-border-2, #ddd);
  }

  &__title {
    font-size: 15px;
    font-weight: 600;
    color: var(--u-text-1);
  }

  &__close {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 50%;
    background: var(--u-background-2, #f5f5f5);
    color: var(--u-text-3);
    font-size: 14px;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    transition: background 0.15s;

    &:active {
      background: var(--u-border-1);
    }
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 4px 16px 16px;

    /* 覆盖 MdCatalog 样式，使其适配 sheet 内 */
    :deep(.md-editor-catalog) {
      max-height: none !important;
      width: 100% !important;
    }
    :deep(.md-editor-catalog-link) {
      padding: 8px 4px;
      font-size: 14px;
      line-height: 1.6;

      span {
        /* 目录项文本截断 */
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }

  &__empty {
    text-align: center;
    color: var(--u-text-3);
    font-size: 14px;
    padding: 32px 0;
    margin: 0;
  }
}

/* 暗色主题 */
:root.dark .toc-sheet {
  box-shadow: 0 -4px 32px rgba(0, 0, 0, 0.4);
}

/* ---- 遮罩渐现 ---- */
.toc-sheet-fade-enter-active,
.toc-sheet-fade-leave-active {
  transition: opacity 0.25s ease;
}
.toc-sheet-fade-enter-from,
.toc-sheet-fade-leave-to {
  opacity: 0;
}

/* ---- 抽屉上滑 ---- */
.toc-sheet-slide-enter-active,
.toc-sheet-slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.33, 1, 0.68, 1);
}
.toc-sheet-slide-enter-from,
.toc-sheet-slide-leave-to {
  transform: translateY(100%);
}
</style>
