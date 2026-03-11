<template>
  <div class="not-found">
    <!-- 主体区域 -->
    <div class="not-found__body">
      <!-- 404 数字插画：用 CSS 绘制信封/纸片意象 -->
      <div class="not-found__illustration">
        <div class="not-found__paper">
          <div class="not-found__paper-fold" />
          <span class="not-found__question">?</span>
        </div>
      </div>

      <!-- 状态码 -->
      <h1 class="not-found__code">{{ t('notFound.code') }}</h1>

      <!-- 标题与描述 -->
      <p class="not-found__title">{{ t('notFound.title') }}</p>
      <p class="not-found__desc">{{ t('notFound.desc') }}</p>

      <!-- 当前访问路径（辅助调试） -->
      <p class="not-found__path">{{ currentPath }}</p>

      <!-- 操作按钮 -->
      <div class="not-found__actions">
        <u-button type="primary" icon="fa-solid fa-house" @click="goHome">
          {{ t('notFound.backHome') }}
        </u-button>
        <u-button plain icon="fa-solid fa-arrow-left" @click="goBack">
          {{ t('notFound.goBack') }}
        </u-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

defineOptions({ name: 'NotFoundView' })

const router = useRouter()
const route = useRoute()
const { t } = useI18n()

/** 当前访问的路径 */
const currentPath = computed(() => route.fullPath)

/** 返回首页 */
function goHome()
{
  router.push('/home')
}

/** 返回上一页 */
function goBack()
{
  if (window.history.length > 1)
  
    router.back()
  
  else
  
    router.push('/home')
  
}
</script>

<style lang="scss" scoped>
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 160px);
  padding: 40px 24px;
  box-sizing: border-box;

  &__body {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    max-width: 480px;
  }

  /* 纸片插画 */
  &__illustration {
    margin-bottom: 24px;
  }

  &__paper {
    position: relative;
    width: 100px;
    height: 120px;
    background: var(--u-background-1);
    border: 2px solid var(--u-border-1);
    border-radius: 6px 16px 6px 6px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.3s ease;

    &:hover {
      transform: rotate(-3deg) translateY(-4px);
    }
  }

  &__paper-fold {
    position: absolute;
    top: 0;
    right: 0;
    width: 24px;
    height: 24px;
    background: var(--u-background-2);
    border-left: 2px solid var(--u-border-1);
    border-bottom: 2px solid var(--u-border-1);
    border-radius: 0 0 0 6px;
  }

  &__question {
    font-size: 48px;
    font-weight: 700;
    color: var(--u-text-4);
    user-select: none;
  }

  /* 状态码 */
  &__code {
    font-size: 72px;
    font-weight: 800;
    letter-spacing: -2px;
    color: var(--u-text-1);
    margin: 0 0 8px;
    line-height: 1;
  }

  /* 标题 */
  &__title {
    font-size: 20px;
    font-weight: 600;
    color: var(--u-text-2);
    margin: 0 0 8px;
  }

  /* 描述 */
  &__desc {
    font-size: 14px;
    color: var(--u-text-3);
    margin: 0 0 12px;
    line-height: 1.6;
  }

  /* 路径 */
  &__path {
    font-size: 12px;
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
    color: var(--u-text-4);
    background: var(--u-background-2);
    padding: 4px 12px;
    border-radius: 4px;
    margin: 0 0 28px;
    word-break: break-all;
    max-width: 100%;
  }

  /* 操作按钮 */
  &__actions {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
    justify-content: center;

    :deep(.u-button) {
      min-width: 184px;
      height: 48px;
      padding: 0 22px;
      border-radius: 14px;
      font-size: 1rem;
      font-weight: 600;
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
    }

    :deep(.u-button + .u-button) {
      margin-left: 0;
    }

    :deep(.u-button .u-button__icon) {
      font-size: 0.95rem;
    }

    :deep(.u-button span) {
      display: inline-flex;
      align-items: center;
      line-height: 1;
    }
  }
}

/* 响应式适配 */
@media (max-width: 480px) {
  .not-found {
    &__code {
      font-size: 56px;
    }

    &__title {
      font-size: 18px;
    }

    &__desc {
      font-size: 13px;
    }

    &__actions {
      width: 100%;
      gap: 10px;

      :deep(.u-button) {
        width: 100%;
        min-width: 0;
      }
    }
  }
}
</style>
