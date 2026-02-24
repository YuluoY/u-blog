<template>
  <!-- 网站新版本提示：固定在 header 下方 20px，带滑入动画 -->
  <Transition name="update-toast">
    <div v-if="hasNewVersion" class="update-toast" @click="refreshToUpdate">
      <div class="update-toast__icon">
        <u-icon icon="fa-solid fa-rotate" />
      </div>
      <div class="update-toast__body">
        <span class="update-toast__title">发现新版本</span>
        <span class="update-toast__desc">网站已更新，点击刷新体验最新内容</span>
      </div>
      <button class="update-toast__close" title="稍后再说" @click.stop="dismiss">
        <u-icon icon="fa-solid fa-xmark" />
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useVersionCheck } from '@/composables/useVersionCheck'

const { hasNewVersion, refreshToUpdate, dismiss } = useVersionCheck()
</script>

<style lang="scss" scoped>
.update-toast {
  position: fixed;
  top: 80px; /* header(60px) + 20px 间距 */
  right: 24px;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--u-background-1, #fff);
  border: 1px solid var(--u-border-1, #e5e5e5);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  max-width: 360px;
  backdrop-filter: blur(12px);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.16);
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: rgba(var(--u-primary-rgb, 64, 158, 255), 0.1);
    color: var(--u-primary, #409eff);
    font-size: 16px;
    flex-shrink: 0;
    animation: spin-slow 3s linear infinite;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__title {
    font-weight: 600;
    font-size: 13px;
    color: var(--u-text-1, #333);
    line-height: 1.4;
  }

  &__desc {
    font-size: 12px;
    color: var(--u-text-3, #999);
    line-height: 1.4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    color: var(--u-text-4, #bbb);
    border-radius: 4px;
    cursor: pointer;
    flex-shrink: 0;
    transition: color 0.15s, background 0.15s;

    &:hover {
      color: var(--u-text-2, #666);
      background: var(--u-background-2, #f5f5f5);
    }
  }
}

/* 滑入/滑出动画 */
.update-toast-enter-active {
  animation: toast-slide-in 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.update-toast-leave-active {
  animation: toast-slide-out 0.25s ease-in forwards;
}

@keyframes toast-slide-in {
  from {
    opacity: 0;
    transform: translateX(100%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0) translateY(0);
  }
}
@keyframes toast-slide-out {
  from {
    opacity: 1;
    transform: translateX(0) translateY(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%) translateY(-20px);
  }
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
