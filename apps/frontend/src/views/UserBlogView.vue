<template>
  <div class="user-blog">
    <!-- 加载状态 -->
    <div v-if="loading" class="user-blog__loading">
      <u-icon icon="fa-solid fa-spinner" spin />
    </div>

    <!-- 加载失败 -->
    <div v-else-if="error" class="user-blog__error">
      <u-icon icon="fa-solid fa-circle-exclamation" />
      <p>{{ error }}</p>
      <u-button plain @click="router.push('/home')">
        {{ t('auth.backToHome') }}
      </u-button>
    </div>

    <!-- 用户博客主体 -->
    <template v-else-if="profile">
      <!-- 用户 Banner -->
      <header class="user-blog__hero">
        <div class="user-blog__hero-bg" />
        <div class="user-blog__hero-content">
          <div class="user-blog__avatar">
            <u-image
              v-if="profile.user.avatar"
              :src="profile.user.avatar"
              :alt="displayName"
              fit="cover"
              :width="80"
              :height="80"
            >
              <template #error>
                <span class="user-blog__avatar-fallback">
                  {{ displayName.charAt(0).toUpperCase() }}
                </span>
              </template>
            </u-image>
            <span v-else class="user-blog__avatar-fallback">
              {{ displayName.charAt(0).toUpperCase() }}
            </span>
          </div>
          <div class="user-blog__info">
            <h1 class="user-blog__name">{{ displayName }}</h1>
            <p v-if="siteName" class="user-blog__site-name">{{ siteName }}</p>
            <p v-if="profile.user.bio" class="user-blog__bio">{{ profile.user.bio }}</p>
            <div v-if="profile.user.location" class="user-blog__location">
              <u-icon icon="fa-solid fa-location-dot" />
              <span>{{ profile.user.location }}</span>
            </div>
          </div>
        </div>
        <!-- 统计 -->
        <div class="user-blog__stats">
          <div class="user-blog__stat">
            <span class="user-blog__stat-num">{{ profile.stats.articleCount }}</span>
            <span class="user-blog__stat-label">{{ t('userBlog.articles') }}</span>
          </div>
          <div class="user-blog__stat">
            <span class="user-blog__stat-num">{{ formatNum(profile.stats.totalViews) }}</span>
            <span class="user-blog__stat-label">{{ t('userBlog.views') }}</span>
          </div>
          <div class="user-blog__stat">
            <span class="user-blog__stat-num">{{ formatNum(profile.stats.totalLikes) }}</span>
            <span class="user-blog__stat-label">{{ t('userBlog.likes') }}</span>
          </div>
        </div>
      </header>

      <!-- 文章列表 -->
      <section class="user-blog__articles">
        <h2 class="user-blog__section-title">
          <u-icon icon="fa-solid fa-pen-nib" />
          <span>{{ t('userBlog.articles') }}</span>
        </h2>
        <div v-if="articlesLoading" class="user-blog__loading">
          <u-icon icon="fa-solid fa-spinner" spin />
        </div>
        <div v-else-if="articles.length === 0" class="user-blog__empty">
          {{ t('userBlog.noArticles') }}
        </div>
        <div v-else class="user-blog__article-list">
          <router-link
            v-for="article in articles"
            :key="article.id"
            :to="`/read/${article.id}`"
            class="user-blog__article-card"
          >
            <div class="user-blog__article-meta">
              <span class="user-blog__article-date">
                {{ formatDate(article.createdAt) }}
              </span>
              <u-tag v-if="article.category" size="small" effect="dark" round>
                {{ article.category.name }}
              </u-tag>
            </div>
            <u-text tag="h3" ellipsis class="user-blog__article-title">{{ article.title }}</u-text>
            <u-text v-if="article.desc" type="info" size="small" :max-line="2" class="user-blog__article-desc">{{ article.desc }}</u-text>
            <div class="user-blog__article-footer">
              <span><u-icon icon="fa-solid fa-eye" /> {{ article.viewCount ?? 0 }}</span>
              <span><u-icon icon="fa-solid fa-heart" /> {{ article.likeCount ?? 0 }}</span>
            </div>
          </router-link>
        </div>
      </section>

      <!-- 友情链接 -->
      <section v-if="friendLinks.length > 0" class="user-blog__links">
        <h2 class="user-blog__section-title">
          <u-icon icon="fa-solid fa-link" />
          <span>{{ t('friendLinks.title') }}</span>
        </h2>
        <div class="user-blog__links-grid">
          <a
            v-for="link in friendLinks"
            :key="link.id"
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
            class="user-blog__link-card"
          >
            <u-image
              v-if="link.icon"
              :src="link.icon"
              alt=""
              :width="18"
              :height="18"
              :radius="4"
              fit="cover"
            >
              <template #error><span /></template>
            </u-image>
            <span class="user-blog__link-title">{{ link.title }}</span>
          </a>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { IArticle, IFriendLink } from '@u-blog/model'
import { CArticleStatus } from '@u-blog/model'
import { getUserBlogProfile, type UserBlogProfile } from '@/api/userBlog'
import { getFriendLinks } from '@/api/friendLink'
import { restQuery } from '@/api/request'

defineOptions({ name: 'UserBlogView' })

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const loading = ref(true)
const error = ref('')
const profile = ref<UserBlogProfile | null>(null)
const articles = ref<IArticle[]>([])
const articlesLoading = ref(false)
const friendLinks = ref<IFriendLink[]>([])

/** 显示名称：优先昵称，兜底用户名 */
const displayName = computed(() => profile.value?.user.namec || profile.value?.user.username || '')

/** 用户自定义站点名称 */
const siteName = computed(() => (profile.value?.settings.site_name as string) || '')

/** 数字格式化：超过 1000 显示 1k+ */
function formatNum(n: number): string {
  if (n >= 10000) return (n / 10000).toFixed(1) + 'w'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

/** 日期格式化 */
function formatDate(d: string | Date | undefined): string {
  if (!d) return ''
  const date = new Date(d)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/** 加载用户博客数据 */
async function loadProfile() {
  const username = route.params.username as string
  if (!username) {
    error.value = '缺少用户名参数'
    loading.value = false
    return
  }
  loading.value = true
  try {
    profile.value = await getUserBlogProfile(username)
    // 并行加载文章和友链
    const userId = profile.value.user.id!
    await Promise.all([
      loadArticles(userId),
      loadFriendLinksForUser(userId),
    ])
  } catch (err: any) {
    error.value = err?.message || '获取用户信息失败'
  } finally {
    loading.value = false
  }
}

/** 加载用户文章 */
async function loadArticles(userId: number) {
  articlesLoading.value = true
  try {
    const list = await restQuery<IArticle[]>('article', {
      where: { userId, status: CArticleStatus.PUBLISHED },
      take: 20,
      skip: 0,
      order: { createdAt: 'DESC' },
      relations: ['category', 'tags'],
    })
    articles.value = Array.isArray(list) ? list : []
  } catch {
    articles.value = []
  } finally {
    articlesLoading.value = false
  }
}

/** 加载用户友链 */
async function loadFriendLinksForUser(userId: number) {
  try {
    friendLinks.value = await getFriendLinks(userId)
  } catch {
    friendLinks.value = []
  }
}

onMounted(loadProfile)
</script>

<style lang="scss" scoped>
.user-blog {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 16px 40px;

  &__loading,
  &__error,
  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 80px 0;
    color: var(--u-text-color-secondary, #999);
    font-size: 14px;
  }

  /* Hero */
  &__hero {
    position: relative;
    padding: 32px 0 24px;
    margin-bottom: 32px;
    border-bottom: 1px solid var(--u-border-color, #eee);
  }
  &__hero-bg {
    position: absolute;
    top: -16px;
    left: -16px;
    right: -16px;
    height: 120px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px;
    opacity: 0.1;
    z-index: 0;
  }
  &__hero-content {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: flex-start;
    gap: 20px;
  }
  &__avatar {
    flex-shrink: 0;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    overflow: hidden;
    border: 3px solid var(--u-bg-color, #fff);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  &__avatar-fallback {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    font-size: 32px;
    font-weight: 700;
  }
  &__info {
    flex: 1;
    min-width: 0;
  }
  &__name {
    font-size: 24px;
    font-weight: 700;
    margin: 0;
    color: var(--u-text-color, #333);
  }
  &__site-name {
    font-size: 14px;
    color: var(--u-primary-color, #667eea);
    margin: 4px 0 0;
    font-weight: 500;
  }
  &__bio {
    font-size: 14px;
    color: var(--u-text-color-secondary, #666);
    margin: 8px 0 0;
    line-height: 1.5;
  }
  &__location {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 8px;
    font-size: 13px;
    color: var(--u-text-color-secondary, #999);
  }

  /* 统计 */
  &__stats {
    position: relative;
    z-index: 1;
    display: flex;
    gap: 32px;
    margin-top: 20px;
    padding-top: 16px;
  }
  &__stat {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  &__stat-num {
    font-size: 22px;
    font-weight: 700;
    color: var(--u-primary-color, #667eea);
    line-height: 1;
  }
  &__stat-label {
    font-size: 12px;
    color: var(--u-text-color-secondary, #999);
    margin-top: 4px;
  }

  /* 区分标题 */
  &__section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 16px;
    color: var(--u-text-color, #333);
  }

  /* 文章列表 */
  &__articles {
    margin-bottom: 32px;
  }
  &__article-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  &__article-card {
    box-sizing: border-box;
    display: block;
    padding: 16px 20px;
    border-radius: 10px;
    border: 1px solid var(--u-border-color, #eee);
    background: var(--u-bg-color, #fff);
    text-decoration: none;
    color: inherit;
    transition: all 0.25s ease;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.1);
      border-color: var(--u-primary-color, #667eea);
    }
  }
  &__article-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }
  &__article-date {
    font-size: 12px;
    color: var(--u-text-color-secondary, #999);
  }
  &__article-title {
    font-size: 16px;
    font-weight: 600;
    margin: 0;
  }
  &__article-desc {
    margin: 6px 0 0;
  }
  &__article-footer {
    display: flex;
    gap: 16px;
    margin-top: 10px;
    font-size: 12px;
    color: var(--u-text-color-secondary, #999);

    span {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }

  /* 友链 */
  &__links {
    margin-bottom: 32px;
  }
  &__links-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  &__link-card {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 20px;
    border: 1px solid var(--u-border-color, #eee);
    background: var(--u-bg-color, #fff);
    text-decoration: none;
    color: var(--u-text-color, #333);
    font-size: 13px;
    transition: all 0.2s;

    &:hover {
      border-color: var(--u-primary-color, #667eea);
      color: var(--u-primary-color, #667eea);
    }
  }
  &__link-title {
    white-space: nowrap;
  }
}

@media (max-width: 640px) {
  .user-blog {
    &__hero-content {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    &__stats {
      justify-content: center;
    }
    &__location {
      justify-content: center;
    }
  }
}
</style>
