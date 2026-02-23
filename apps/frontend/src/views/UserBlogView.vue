<template>
  <div class="user-blog">
    <!-- 加载状态 -->
    <div v-if="loading" class="user-blog__skeleton">
      <div class="user-blog__skeleton-avatar" />
      <div class="user-blog__skeleton-line w60" />
      <div class="user-blog__skeleton-line w40" />
    </div>

    <!-- 加载失败 -->
    <div v-else-if="error" class="user-blog__error">
      <div class="user-blog__error-icon">!</div>
      <p class="user-blog__error-text">{{ error }}</p>
      <u-button type="primary" round @click="router.push('/home')">
        {{ t('auth.backToHome') }}
      </u-button>
    </div>

    <!-- 用户博客主体 -->
    <template v-else-if="profile">
      <!-- Profile Card -->
      <div class="user-blog__profile-card">
        <!-- 头像 -->
        <div class="user-blog__avatar-wrap">
          <div class="user-blog__avatar">
            <u-image
              v-if="profile.user.avatar"
              :src="profile.user.avatar"
              :alt="displayName"
              fit="cover"
              :width="96"
              :height="96"
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
          <!-- 在线状态圆点 -->
          <span class="user-blog__avatar-badge" />
        </div>

        <!-- 用户信息 -->
        <div class="user-blog__identity">
          <h1 class="user-blog__name">{{ displayName }}</h1>
          <span v-if="profile.user.role" class="user-blog__role-badge">
            {{ roleLabel }}
          </span>
        </div>
        <p v-if="profile.user.bio" class="user-blog__bio">{{ profile.user.bio }}</p>

        <!-- Metadata 标签行 -->
        <div class="user-blog__meta-row">
          <span v-if="profile.user.location" class="user-blog__meta-tag">
            <u-icon icon="fa-solid fa-location-dot" />
            {{ profile.user.location }}
          </span>
          <span v-if="siteName" class="user-blog__meta-tag">
            <u-icon icon="fa-solid fa-globe" />
            {{ siteName }}
          </span>
          <span class="user-blog__meta-tag">
            <u-icon icon="fa-solid fa-calendar" />
            {{ t('userBlog.joinedAt') }} {{ joinedDate }}
          </span>
        </div>

        <!-- Bento 风格统计卡片 -->
        <div class="user-blog__stats-grid">
          <div class="user-blog__stat-card">
            <span class="user-blog__stat-num">{{ profile.stats.articleCount }}</span>
            <span class="user-blog__stat-label">{{ t('userBlog.articles') }}</span>
          </div>
          <div class="user-blog__stat-card">
            <span class="user-blog__stat-num">{{ formatNum(profile.stats.totalViews) }}</span>
            <span class="user-blog__stat-label">{{ t('userBlog.views') }}</span>
          </div>
          <div class="user-blog__stat-card">
            <span class="user-blog__stat-num">{{ formatNum(profile.stats.totalLikes) }}</span>
            <span class="user-blog__stat-label">{{ t('userBlog.likes') }}</span>
          </div>
        </div>
      </div>

      <!-- 文章列表 -->
      <section class="user-blog__articles">
        <div class="user-blog__section-header">
          <h2 class="user-blog__section-title">
            {{ t('userBlog.articles') }}
          </h2>
          <span class="user-blog__section-count">{{ articles.length }}</span>
        </div>
        <div v-if="articlesLoading" class="user-blog__skeleton">
          <div v-for="i in 3" :key="i" class="user-blog__skeleton-line card" />
        </div>
        <div v-else-if="articles.length === 0" class="user-blog__empty">
          <u-icon icon="fa-solid fa-feather" />
          <span>{{ t('userBlog.noArticles') }}</span>
        </div>
        <div v-else class="user-blog__article-list">
          <router-link
            v-for="(article, idx) in articles"
            :key="article.id"
            :to="`/read/${article.id}`"
            class="user-blog__article-card"
            :style="{ '--delay': `${idx * 60}ms` }"
          >
            <!-- 封面缩略图 -->
            <div v-if="article.cover" class="user-blog__article-cover">
              <u-image :src="article.cover" fit="cover" :width="80" :height="80" :radius="8" />
            </div>
            <div class="user-blog__article-body">
              <div class="user-blog__article-top">
                <u-tag v-if="article.category" size="small" round>
                  {{ article.category.name }}
                </u-tag>
                <time class="user-blog__article-date">{{ formatDate(article.createdAt) }}</time>
              </div>
              <h3 class="user-blog__article-title">{{ article.title }}</h3>
              <p v-if="article.desc" class="user-blog__article-desc">{{ article.desc }}</p>
              <div class="user-blog__article-footer">
                <span><u-icon icon="fa-regular fa-eye" /> {{ article.viewCount ?? 0 }}</span>
                <span><u-icon icon="fa-regular fa-heart" /> {{ article.likeCount ?? 0 }}</span>
              </div>
            </div>
          </router-link>
        </div>
      </section>

      <!-- 友情链接 -->
      <section v-if="friendLinks.length > 0" class="user-blog__links">
        <div class="user-blog__section-header">
          <h2 class="user-blog__section-title">{{ t('friendLinks.title') }}</h2>
          <span class="user-blog__section-count">{{ friendLinks.length }}</span>
        </div>
        <div class="user-blog__links-grid">
          <a
            v-for="link in friendLinks"
            :key="link.id"
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
            class="user-blog__link-pill"
          >
            <u-image v-if="link.icon" :src="link.icon" alt="" :width="16" :height="16" :radius="4" fit="cover">
              <template #error><u-icon icon="fa-solid fa-link" /></template>
            </u-image>
            <u-icon v-else icon="fa-solid fa-link" />
            <span>{{ link.title }}</span>
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

/** 角色标签 */
const roleLabel = computed(() => {
  const role = profile.value?.user.role
  const map: Record<string, string> = {
    super_admin: t('profile.roleSuperAdmin'),
    admin: t('profile.roleAdmin'),
    user: t('profile.roleUser'),
  }
  return map[role as string] || role || ''
})

/** 注册日期 */
const joinedDate = computed(() => {
  const d = profile.value?.user.createdAt
  if (!d) return ''
  const date = new Date(d)
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`
})

/** 数字格式化 */
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
/* ============================================================
   UserBlogView — Modern Profile Page
   设计语言：大留白 + 圆角卡片 + 微渐变 + 入场动画
   ============================================================ */

.user-blog {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 20px 60px;

  /* ---- Skeleton 骨架屏 ---- */
  &__skeleton {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 40px 0;
  }
  &__skeleton-avatar {
    width: 96px;
    height: 96px;
    border-radius: 50%;
    background: var(--u-background-3);
    animation: shimmer 1.5s infinite;
  }
  &__skeleton-line {
    height: 16px;
    border-radius: 8px;
    background: linear-gradient(110deg, var(--u-background-3) 30%, var(--u-background-2) 50%, var(--u-background-3) 70%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    &.w60 { width: 60%; }
    &.w40 { width: 40%; }
    &.card { width: 100%; height: 80px; border-radius: 12px; }
  }

  /* ---- Error 错误态 ---- */
  &__error {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 80px 0;
  }
  &__error-icon {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: 700;
    color: var(--u-danger, #e74c3c);
    background: rgba(231, 76, 60, 0.08);
  }
  &__error-text {
    font-size: 14px;
    color: var(--u-text-3);
    margin: 0;
  }

  /* ---- Profile Card ---- */
  &__profile-card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 32px 24px 24px;
    animation: fadeInUp 0.5s ease both;
  }

  /* 头像 */
  &__avatar-wrap {
    position: relative;
  }
  &__avatar {
    width: 96px;
    height: 96px;
    border-radius: 50%;
    overflow: hidden;
    border: 4px solid var(--u-background-1);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
    background: var(--u-background-1);
  }
  &__avatar-fallback {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--u-primary), var(--u-primary-1));
    color: #fff;
    font-size: 36px;
    font-weight: 700;
  }
  &__avatar-badge {
    position: absolute;
    bottom: 4px;
    right: 4px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--u-success, #2ebe50);
    border: 3px solid var(--u-background-1);
  }

  /* 身份 */
  &__identity {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 16px;
  }
  &__name {
    font-size: 22px;
    font-weight: 700;
    margin: 0;
    color: var(--u-text-1);
    letter-spacing: -0.02em;
  }
  &__role-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 10px;
    border-radius: 100px;
    font-size: 11px;
    font-weight: 600;
    color: var(--u-primary);
    background: var(--u-primary-light-6);
    letter-spacing: 0.02em;
    white-space: nowrap;
  }

  /* Bio */
  &__bio {
    font-size: 14px;
    color: var(--u-text-2);
    margin: 8px 0 0;
    line-height: 1.6;
    max-width: 480px;
  }

  /* Metadata 标签行 */
  &__meta-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
    margin-top: 12px;
  }
  &__meta-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--u-text-3);
  }

  /* Bento 统计卡片 */
  &__stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-top: 24px;
    width: 100%;
    max-width: 400px;
  }
  &__stat-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 16px 8px;
    border-radius: 14px;
    background: var(--u-background-2);
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
    }
  }
  &__stat-num {
    font-size: 20px;
    font-weight: 700;
    color: var(--u-text-1);
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  &__stat-label {
    font-size: 11px;
    color: var(--u-text-3);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* ---- Section Header ---- */
  &__section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
  }
  &__section-title {
    font-size: 16px;
    font-weight: 600;
    margin: 0;
    color: var(--u-text-1);
  }
  &__section-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 22px;
    height: 22px;
    padding: 0 6px;
    border-radius: 100px;
    font-size: 11px;
    font-weight: 600;
    color: var(--u-text-3);
    background: var(--u-background-3);
  }

  /* Empty */
  &__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 48px 0;
    color: var(--u-text-3);
    font-size: 14px;
  }

  /* ---- 文章列表 ---- */
  &__articles {
    margin-top: 32px;
  }
  &__article-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  &__article-card {
    box-sizing: border-box;
    display: flex;
    gap: 16px;
    padding: 16px;
    border-radius: 14px;
    background: var(--u-background-1);
    border: 1px solid var(--u-border-1);
    text-decoration: none;
    color: inherit;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    animation: fadeInUp 0.4s ease both;
    animation-delay: var(--delay, 0ms);

    &:hover {
      border-color: var(--u-primary-light-4);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
      transform: translateY(-2px);
    }
  }
  &__article-cover {
    flex-shrink: 0;
    border-radius: 8px;
    overflow: hidden;
    width: 80px;
    height: 80px;
  }
  &__article-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  &__article-top {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }
  &__article-date {
    font-size: 12px;
    color: var(--u-text-3);
    font-variant-numeric: tabular-nums;
  }
  &__article-title {
    font-size: 15px;
    font-weight: 600;
    margin: 0;
    color: var(--u-text-1);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  &__article-desc {
    font-size: 13px;
    color: var(--u-text-3);
    margin: 4px 0 0;
    line-height: 1.5;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  &__article-footer {
    display: flex;
    gap: 14px;
    margin-top: auto;
    padding-top: 8px;
    font-size: 12px;
    color: var(--u-text-3);

    span {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
  }

  /* ---- 友链 ---- */
  &__links {
    margin-top: 32px;
  }
  &__links-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  &__link-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 100px;
    border: 1px solid var(--u-border-1);
    background: var(--u-background-1);
    text-decoration: none;
    color: var(--u-text-2);
    font-size: 13px;
    transition: all 0.2s ease;

    &:hover {
      border-color: var(--u-primary);
      color: var(--u-primary);
      background: var(--u-primary-light-6);
    }
  }
}

/* ---- 动画 ---- */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* ---- 移动端响应式 ---- */
@media (max-width: 640px) {
  .user-blog {
    padding: 0 16px 40px;

    &__profile-card {
      padding: 24px 16px 16px;
    }
    &__avatar {
      width: 80px;
      height: 80px;
    }
    &__name {
      font-size: 20px;
    }
    &__stats-grid {
      max-width: 100%;
    }
    &__article-card {
      padding: 12px;
    }
    &__article-cover {
      width: 64px;
      height: 64px;
    }
  }
}
</style>
