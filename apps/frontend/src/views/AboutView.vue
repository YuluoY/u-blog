<template>
  <div class="about-page">
    <!-- 页面 Hero：渐变背景 + 打字机效果 -->
    <header class="about-page__hero">
      <div class="about-page__hero-bg" />
      <div class="about-page__hero-content">
        <h1 class="about-page__title">{{ t('about.title') }}</h1>
        <p class="about-page__subtitle">{{ t('about.subtitle') }}</p>
        <div class="about-page__hero-stats">
          <div class="about-page__stat">
            <span class="about-page__stat-icon">
              <u-icon icon="fa-solid fa-layer-group" />
            </span>
            <span class="about-page__stat-label">{{ t('about.stats.monorepo') }}</span>
          </div>
          <div class="about-page__stat">
            <span class="about-page__stat-icon">
              <u-icon icon="fa-solid fa-cube" />
            </span>
            <span class="about-page__stat-label">{{ t('about.stats.apps') }}</span>
          </div>
          <div class="about-page__stat">
            <span class="about-page__stat-icon">
              <u-icon icon="fa-solid fa-puzzle-piece" />
            </span>
            <span class="about-page__stat-label">{{ t('about.stats.components') }}</span>
          </div>
          <div class="about-page__stat">
            <span class="about-page__stat-icon">
              <u-icon icon="fa-solid fa-language" />
            </span>
            <span class="about-page__stat-label">{{ t('about.stats.i18n') }}</span>
          </div>
        </div>
      </div>
    </header>

    <!-- 加载状态 -->
    <div v-if="loading" class="about-page__loading">
      <u-icon icon="fa-solid fa-spinner" spin />
      <span>{{ t('about.loading') }}</span>
    </div>

    <!-- 区块列表 -->
    <div v-else class="about-page__blocks">
      <template v-for="(block, idx) in blocks" :key="block.id">
        <!-- WHOAMI - 个人介绍（特殊卡片样式）-->
        <section
          v-if="block.type === PAGE_BLOCK_TYPE.WHOAMI"
          class="about-page__block about-page__whoami"
          :style="{ animationDelay: `${idx * 0.1}s` }"
        >
          <div class="about-page__block-header">
            <span class="about-page__block-icon about-page__block-icon--whoami">
              <u-icon icon="fa-regular fa-user" />
            </span>
            <h2 class="about-page__block-title">{{ block.title }}</h2>
          </div>
          <div class="about-page__whoami-content">
            <MarkdownPreview :content="block.content" />
          </div>
        </section>

        <!-- INTRO - 关于站点 -->
        <section
          v-else-if="block.type === PAGE_BLOCK_TYPE.INTRO"
          class="about-page__block about-page__intro"
          :style="{ animationDelay: `${idx * 0.1}s` }"
        >
          <div class="about-page__block-header">
            <span class="about-page__block-icon about-page__block-icon--intro">
              <u-icon icon="fa-solid fa-circle-info" />
            </span>
            <h2 class="about-page__block-title">{{ block.title }}</h2>
          </div>
          <div class="about-page__intro-content">
            <MarkdownPreview :content="block.content" />
          </div>
        </section>

        <!-- CUSTOM - 自定义区块 -->
        <section
          v-else-if="block.type === PAGE_BLOCK_TYPE.CUSTOM"
          class="about-page__block about-page__custom"
          :style="{ animationDelay: `${idx * 0.1}s` }"
        >
          <div v-if="block.title" class="about-page__block-header">
            <span class="about-page__block-icon about-page__block-icon--custom">
              <u-icon :icon="getCustomIcon(block.title)" />
            </span>
            <h2 class="about-page__block-title">{{ block.title }}</h2>
          </div>
          <div class="about-page__custom-content">
            <MarkdownPreview :content="block.content" />
          </div>
        </section>
      </template>
    </div>

    <!-- 页脚装饰 -->
    <footer class="about-page__footer">
      <p>{{ t('about.footer') }}</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { IPageBlockVo } from '@u-blog/model'
import { getAboutBlocks } from '@/api/pageBlock'
import MarkdownPreview from '@/components/MarkdownPreview.vue'

defineOptions({ name: 'AboutView' })

const { t } = useI18n()

/* SEO 元信息 */
import { useSeo } from '@/composables/useSeo'
useSeo({
  title: '关于',
  description: '关于 U-Blog 与博主，了解技术栈、开发理念与联系方式',
  keywords: '关于,博主,技术栈,开发理念',
})

/** 区块类型常量 */
const PAGE_BLOCK_TYPE = {
  INTRO: 'intro',
  WHOAMI: 'whoami',
  CUSTOM: 'custom',
} as const

/** 自定义区块图标映射（按区块标题匹配） */
const CUSTOM_ICON_MAP: Record<string, string> = {
  '技术架构': 'fa-solid fa-sitemap',
  '设计理念': 'fa-solid fa-lightbulb',
  '开源致谢': 'fa-solid fa-heart',
  '联系我': 'fa-solid fa-paper-plane',
}
const CUSTOM_ICON_DEFAULT = 'fa-solid fa-puzzle-piece'

const blocks = ref<IPageBlockVo[]>([])
const loading = ref(false)

/** 根据区块标题返回对应图标 */
function getCustomIcon(title: string): string
{
  return CUSTOM_ICON_MAP[title] || CUSTOM_ICON_DEFAULT
}

async function fetchBlocks()
{
  loading.value = true
  try
  {
    blocks.value = await getAboutBlocks()
  }
  catch (error)
  {
    console.error('获取关于页区块失败:', error)
    blocks.value = []
  }
  finally
  {
    loading.value = false
  }
}

onMounted(() =>
{
  fetchBlocks()
})
</script>

<style lang="scss" scoped>
/* 入场动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.about-page {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: 36px;

  *, *::before, *::after {
    box-sizing: border-box;
  }

  /* ===== Hero ===== */
  &__hero {
    position: relative;
    padding: 40px 0 32px;
    overflow: hidden;
  }

  &__hero-bg {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      135deg,
      rgba(var(--u-primary-rgb), 0.06) 0%,
      rgba(var(--u-primary-rgb), 0.02) 50%,
      transparent 100%
    );
    border-radius: 0 0 24px 24px;
    pointer-events: none;
  }

  &__hero-content {
    position: relative;
    z-index: 1;
  }

  &__title {
    font-size: 2.6rem;
    font-weight: 800;
    color: var(--u-text-1);
    margin: 0;
    line-height: 1.3;
    letter-spacing: -0.02em;
  }

  &__subtitle {
    font-size: 1.35rem;
    color: var(--u-text-2);
    margin: 8px 0 0;
    line-height: 1.6;
  }

  &__hero-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-top: 24px;
  }

  &__stat {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--u-background-2);
    border: 1px solid var(--u-border-1);
    border-radius: 20px;
    padding: 6px 14px;
    font-size: 1.2rem;
    color: var(--u-text-2);
    transition: all 0.2s ease;

    &:hover {
      border-color: var(--u-primary);
      color: var(--u-primary);
      background: rgba(var(--u-primary-rgb), 0.06);
    }
  }

  &__stat-icon {
    font-size: 1.1rem;
    color: var(--u-primary);
    display: flex;
    align-items: center;
  }

  &__stat-label {
    white-space: nowrap;
  }

  /* ===== Loading ===== */
  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 48px;
    color: var(--u-text-2);
    font-size: 1.4rem;
  }

  /* ===== Blocks ===== */
  &__blocks {
    display: flex;
    flex-direction: column;
    gap: 40px;
  }

  &__block {
    width: 100%;
    max-width: 100%;
    overflow: hidden;
    background: var(--u-background-2);
    border: 1px solid var(--u-border-1);
    border-radius: 16px;
    padding: 28px;
    animation: fadeInUp 0.5s ease both;
    transition: box-shadow 0.3s ease, border-color 0.3s ease;

    &:hover {
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
      border-color: rgba(var(--u-primary-rgb), 0.3);
    }
  }

  &__block-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
  }

  &__block-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 10px;
    font-size: 1.4rem;
    flex-shrink: 0;

    &--whoami {
      background: rgba(var(--u-primary-rgb), 0.12);
      color: var(--u-primary);
    }

    &--intro {
      background: rgba(52, 199, 89, 0.12);
      color: #34c759;
    }

    &--custom {
      background: rgba(0, 122, 255, 0.12);
      color: #007aff;
    }
  }

  &__block-title {
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--u-text-1);
    margin: 0;
    line-height: 1.4;
  }

  /* ===== WHOAMI ===== */
  &__whoami-content {
    :deep(.markdown-preview) {
      font-size: 1.4rem;
      line-height: 1.9;
      color: var(--u-text-1);

      p { margin-bottom: 1em; }

      blockquote {
        border-left: 3px solid var(--u-primary);
        padding-left: 16px;
        margin: 16px 0;
        color: var(--u-text-2);
        font-style: italic;
      }
    }
  }

  /* ===== INTRO ===== */
  &__intro-content {
    :deep(.markdown-preview) {
      font-size: 1.35rem;
      line-height: 1.9;
      color: var(--u-text-1);

      ul { padding-left: 20px; list-style: none; }
      li {
        margin: 10px 0;
        position: relative;
        padding-left: 4px;
      }
      strong { color: var(--u-primary); }
    }
  }

  /* ===== CUSTOM ===== */
  &__custom-content {
    :deep(.markdown-preview) {
      font-size: 1.35rem;
      line-height: 1.85;
      color: var(--u-text-1);

      strong { color: var(--u-primary); }

      /* 代码块：跟随 md-editor-v3 内置主题，仅修正布局问题 */
      .md-editor-code {
        margin: 1em 0;
        border-radius: 10px;
        overflow: visible;
        font-size: 1.25rem;
        line-height: 1.7;

        /*
         * 禁用库默认 sticky 头部：在页面滚动容器内会产生位移偏差
         * （同 chat 页面的处理方式）
         */
        .md-editor-code-head {
          position: relative;
          top: auto;
          z-index: auto;
        }

        /* 代码字体统一 + 允许横向滚动 */
        pre {
          font-family: 'SF Mono', 'Fira Code', 'JetBrains Mono', monospace !important;
          font-size: inherit;
          line-height: inherit;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        code {
          font-family: 'SF Mono', 'Fira Code', 'JetBrains Mono', monospace !important;
          font-size: inherit;
          line-height: inherit;
          word-break: normal;
        }
      }

      /* 行内代码 */
      :not(pre) > code {
        font-family: 'SF Mono', 'Fira Code', 'JetBrains Mono', monospace;
      }
    }
  }

  /* ===== Footer ===== */
  &__footer {
    text-align: center;
    padding: 24px 0 8px;
    color: var(--u-text-3);
    font-size: 1.2rem;
    border-top: 1px solid var(--u-border-1);

    p { margin: 0; }
  }
}

/* ===== 暗色模式细节调整 ===== */
html.dark .about-page {
  &__block:hover {
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  }

  &__block-icon {
    &--intro { color: #30d158; }
    &--custom { color: #64d2ff; }
  }
}

/* ===== 响应式 ===== */
@media (max-width: 767px) {
  .about-page {
    gap: 20px;

    &__hero {
      padding: 20px 0 16px;
    }

    &__title {
      font-size: 1.8rem;
    }

    &__subtitle {
      font-size: 1.1rem;
    }

    &__hero-stats {
      gap: 8px;
      margin-top: 16px;
    }

    &__stat {
      font-size: 1rem;
      padding: 4px 10px;
      gap: 6px;
    }

    &__stat-icon {
      font-size: 1rem;
    }

    &__blocks {
      gap: 20px;
    }

    &__block {
      padding: 16px;
      border-radius: 12px;
      /* 允许代码块内部横向滚动 */
      overflow: visible;
    }

    &__block-header {
      margin-bottom: 12px;
      gap: 10px;
    }

    &__block-icon {
      width: 28px;
      height: 28px;
      font-size: 1.1rem;
      border-radius: 8px;
    }

    &__block-title {
      font-size: 1.3rem;
    }

    /* 各内容区字号缩小 */
    &__whoami-content :deep(.markdown-preview) {
      font-size: 1.25rem;
      line-height: 1.75;
    }

    &__intro-content :deep(.markdown-preview) {
      font-size: 1.2rem;
      line-height: 1.75;

      ul { padding-left: 16px; }
      li { margin: 8px 0; }
    }

    &__custom-content :deep(.markdown-preview) {
      font-size: 1.2rem;
      line-height: 1.7;

      /* 移动端代码块：缩小字号，保证可横向滚动 */
      .md-editor-code {
        font-size: 1.1rem;
        margin: 0.75em -16px;
        border-radius: 0;
        border-left: none;
        border-right: none;

        pre {
          padding: 14px 16px;
        }
      }
    }

    &__footer {
      padding: 16px 0 4px;
      font-size: 1.1rem;
    }
  }
}</style>
