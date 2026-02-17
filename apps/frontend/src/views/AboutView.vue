<template>
  <div class="about-page">
    <!-- 页面 Hero -->
    <header class="about-page__hero">
      <div class="about-page__hero-content">
        <h1 class="about-page__title">{{ t('about.title') }}</h1>
        <p class="about-page__desc">{{ t('about.desc') }}</p>
      </div>
    </header>

    <!-- 加载状态 -->
    <div v-if="loading" class="about-page__loading">
      <u-icon icon="fa-solid fa-spinner" spin />
      <span>{{ t('about.loading') }}</span>
    </div>

    <!-- 区块列表 -->
    <div v-else class="about-page__blocks">
      <template v-for="block in blocks" :key="block.id">
        <!-- WHOAMI - 个人介绍 -->
        <section
          v-if="block.type === PAGE_BLOCK_TYPE.WHOAMI"
          class="about-page__block about-page__whoami"
        >
          <h2 class="about-page__block-title">
            <u-icon icon="fa-regular fa-user" />
            <span>{{ block.title }}</span>
          </h2>
          <div class="about-page__whoami-content">
            <MarkdownPreview :content="block.content" />
          </div>
        </section>

        <!-- INTRO - 关于站点 -->
        <section
          v-else-if="block.type === PAGE_BLOCK_TYPE.INTRO"
          class="about-page__block about-page__intro"
        >
          <h2 class="about-page__block-title">
            <u-icon icon="fa-solid fa-circle-info" />
            <span>{{ block.title }}</span>
          </h2>
          <div class="about-page__intro-content">
            <MarkdownPreview :content="block.content" />
          </div>
        </section>

        <!-- SKILLS - 技术栈与熟练度 -->
        <section
          v-else-if="isSkillsType(block.type)"
          class="about-page__block about-page__skills"
        >
          <h2 class="about-page__block-title">
            <u-icon icon="fa-solid fa-code" />
            <span>{{ block.title }}</span>
          </h2>
          <div class="about-page__skills-groups">
            <div
              v-for="group in getSkillGroups(block.extra)"
              :key="group.name"
              class="about-page__skills-group"
            >
              <h3 class="about-page__skills-group-name">{{ group.name }}</h3>
              <div class="about-page__skills-items">
                <div
                  v-for="item in group.items"
                  :key="item.name"
                  class="about-page__skill-item"
                >
                  <span class="about-page__skill-name">{{ item.name }}</span>
                  <div class="about-page__skill-bar">
                    <div
                      class="about-page__skill-bar-fill"
                      :style="{ width: `${(item.level / 5) * 100}%` }"
                    />
                  </div>
                  <span class="about-page__skill-level">{{ item.level }} / 5</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- TIMELINE - 时间线 -->
        <section
          v-else-if="isTimelineType(block.type)"
          class="about-page__block about-page__timeline"
        >
          <h2 class="about-page__block-title">
            <u-icon icon="fa-solid fa-clock" />
            <span>{{ block.title }}</span>
          </h2>
          <div class="about-page__timeline-items">
            <div
              v-for="(item, index) in getTimelineItems(block.extra)"
              :key="index"
              class="about-page__timeline-item"
            >
              <div class="about-page__timeline-dot" />
              <div class="about-page__timeline-content">
                <span class="about-page__timeline-year">{{ item.year }}</span>
                <h4 class="about-page__timeline-title">{{ item.title }}</h4>
                <p class="about-page__timeline-desc">{{ item.desc }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- CUSTOM - 自定义区块 -->
        <section
          v-else-if="block.type === PAGE_BLOCK_TYPE.CUSTOM"
          class="about-page__block about-page__custom"
        >
          <h2 v-if="block.title" class="about-page__block-title">
            <u-icon icon="fa-solid fa-puzzle-piece" />
            <span>{{ block.title }}</span>
          </h2>
          <div class="about-page__custom-content">
            <MarkdownPreview :content="block.content" />
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { IPageBlockVo } from '@u-blog/model'
import { getAboutBlocks } from '@/api/pageBlock'
import MarkdownPreview from '@/components/MarkdownPreview.vue'

defineOptions({ name: 'AboutView' })

const { t } = useI18n()

/** 区块类型常量 */
const PAGE_BLOCK_TYPE = {
  INTRO: 'intro',
  WHOAMI: 'whoami',
  EXPERIENCE: 'experience',
  WHY_BLOG: 'why_blog',
  TIMELINE: 'timeline',
  SKILLS: 'skills',
  CUSTOM: 'custom',
} as const

/** 技能区块额外数据 */
interface ISkillsGroup {
  name: string
  items: { name: string; level: number }[]
}

interface ISkillsExtra {
  groups: ISkillsGroup[]
}

/** 时间线区块额外数据 */
interface ITimelineItem {
  year: string
  title: string
  desc: string
}

interface ITimelineExtra {
  items: ITimelineItem[]
}

const blocks = ref<IPageBlockVo[]>([])
const loading = ref(false)

/** 判断是否为技能类型 */
function isSkillsType(type: string): boolean {
  return type === PAGE_BLOCK_TYPE.SKILLS
}

/** 获取技能组数据 */
function getSkillGroups(extra?: Record<string, unknown> | null): ISkillsGroup[] {
  if (!extra) return []
  const data = extra as unknown as ISkillsExtra
  return data?.groups ?? []
}

/** 判断是否为时间线类型 */
function isTimelineType(type: string): boolean {
  return type === PAGE_BLOCK_TYPE.TIMELINE
}

/** 获取时间线数据 */
function getTimelineItems(extra?: Record<string, unknown> | null): ITimelineItem[] {
  if (!extra) return []
  const data = extra as unknown as ITimelineExtra
  return data?.items ?? []
}

async function fetchBlocks() {
  loading.value = true
  try {
    blocks.value = await getAboutBlocks()
  } catch (error) {
    console.error('获取关于页区块失败:', error)
    blocks.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchBlocks()
})
</script>

<style lang="scss" scoped>
.about-page {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 32px;

  /* Hero */
  &__hero {
    padding: 32px 0 24px;
    border-bottom: 1px solid var(--u-border-1);
  }

  &__title {
    font-size: 2.4rem;
    font-weight: 800;
    color: var(--u-text-1);
    margin: 0;
    line-height: 1.3;
  }

  &__desc {
    font-size: 1.35rem;
    color: var(--u-text-2);
    margin: 6px 0 0;
  }

  /* Loading */
  &__loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 48px;
    color: var(--u-text-2);
    font-size: 1.4rem;
  }

  /* Blocks */
  &__blocks {
    display: flex;
    flex-direction: column;
    gap: 48px;
  }

  &__block {
    width: 100%;
  }

  &__block-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--u-text-1);
    margin: 0 0 20px;
    padding-bottom: 12px;
    border-bottom: 2px solid var(--u-primary);

    .u-icon {
      font-size: 1.6rem;
      color: var(--u-primary);
    }
  }

  /* WHOAMI */
  &__whoami-content {
    :deep(.markdown-preview) {
      font-size: 1.5rem;
      line-height: 1.8;
      color: var(--u-text-1);

      p {
        margin-bottom: 1em;
      }
    }
  }

  /* INTRO */
  &__intro-content {
    :deep(.markdown-preview) {
      font-size: 1.4rem;
      line-height: 1.8;
      color: var(--u-text-1);

      ul {
        padding-left: 20px;
      }

      li {
        margin: 8px 0;
      }

      strong {
        color: var(--u-primary);
      }
    }
  }

  /* SKILLS */
  &__skills-groups {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 24px;
  }

  &__skills-group {
    background: var(--u-background-2);
    border-radius: 12px;
    padding: 20px;
    border: 1px solid var(--u-border-1);
  }

  &__skills-group-name {
    font-size: 1.3rem;
    font-weight: 600;
    color: var(--u-text-1);
    margin: 0 0 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--u-border-1);
  }

  &__skills-items {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__skill-item {
    display: grid;
    grid-template-columns: 1fr auto auto;
    align-items: center;
    gap: 12px;
  }

  &__skill-name {
    font-size: 1.2rem;
    color: var(--u-text-1);
    font-weight: 500;
  }

  &__skill-bar {
    width: 100px;
    height: 6px;
    background: var(--u-background-3);
    border-radius: 3px;
    overflow: hidden;
  }

  &__skill-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--u-primary) 0%, var(--u-success) 100%);
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  &__skill-level {
    font-size: 1rem;
    color: var(--u-text-3);
    min-width: 40px;
    text-align: right;
  }

  /* TIMELINE */
  &__timeline-items {
    position: relative;
    padding-left: 24px;

    &::before {
      content: '';
      position: absolute;
      left: 4px;
      top: 8px;
      bottom: 8px;
      width: 2px;
      background: var(--u-border-1);
    }
  }

  &__timeline-item {
    position: relative;
    padding-bottom: 24px;

    &:last-child {
      padding-bottom: 0;
    }
  }

  &__timeline-dot {
    position: absolute;
    left: -24px;
    top: 6px;
    width: 10px;
    height: 10px;
    background: var(--u-primary);
    border-radius: 50%;
    border: 2px solid var(--u-background-1);

    &::after {
      content: '';
      position: absolute;
      left: -6px;
      top: -6px;
      width: 18px;
      height: 18px;
      background: rgba(var(--u-primary-rgb), 0.2);
      border-radius: 50%;
    }
  }

  &__timeline-content {
    padding-left: 8px;
  }

  &__timeline-year {
    display: inline-block;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--u-primary);
    background: rgba(var(--u-primary-rgb), 0.1);
    padding: 2px 10px;
    border-radius: 4px;
    margin-bottom: 6px;
  }

  &__timeline-title {
    font-size: 1.3rem;
    font-weight: 600;
    color: var(--u-text-1);
    margin: 0 0 4px;
  }

  &__timeline-desc {
    font-size: 1.2rem;
    color: var(--u-text-2);
    margin: 0;
    line-height: 1.5;
  }

  /* CUSTOM */
  &__custom-content {
    :deep(.markdown-preview) {
      font-size: 1.4rem;
      line-height: 1.8;
      color: var(--u-text-1);
    }
  }
}

/* 响应式 */
@media (max-width: 767px) {
  .about-page {
    gap: 24px;

    &__hero {
      padding: 20px 0 16px;
    }

    &__title {
      font-size: 2rem;
    }

    &__desc {
      font-size: 1.2rem;
    }

    &__blocks {
      gap: 32px;
    }

    &__block-title {
      font-size: 1.5rem;
    }

    &__skills-groups {
      grid-template-columns: 1fr;
    }

    &__skill-item {
      grid-template-columns: 1fr auto;
      gap: 8px;
    }

    &__skill-level {
      display: none;
    }
  }
}
</style>
