<template>
  <div class="profile-panel">
    <!-- 头像 -->
    <div class="profile-panel__avatar-wrap">
      <img
        v-if="user?.avatar"
        class="profile-panel__avatar"
        :src="user.avatar"
        :alt="displayName"
      />
      <div v-else class="profile-panel__avatar profile-panel__avatar--placeholder">
        <u-icon icon="fa-solid fa-user" size="2x" />
      </div>
    </div>
    <!-- 昵称 + 角色 -->
    <u-text class="profile-panel__name">{{ displayName }}</u-text>
    <u-text v-if="user?.role" class="profile-panel__role">
      <u-icon icon="fa-solid fa-shield-halved" />
      {{ roleLabel }}
    </u-text>
    <!-- 简介 -->
    <u-text v-if="user?.bio" class="profile-panel__bio">{{ user.bio }}</u-text>
    <!-- 信息项：来自 users 表真实字段 -->
    <div class="profile-panel__meta">
      <div v-if="user?.location" class="profile-panel__meta-item">
        <u-icon icon="fa-solid fa-location-dot" />
        <span>{{ user.location }}</span>
      </div>
      <div v-if="user?.email" class="profile-panel__meta-item">
        <u-icon icon="fa-solid fa-envelope" />
        <span>{{ user.email }}</span>
      </div>
      <div v-if="user?.createdAt" class="profile-panel__meta-item">
        <u-icon icon="fa-solid fa-clock" />
        <span>{{ t('profile.registeredAt') }} {{ formatDate(user.createdAt) }}</span>
      </div>
    </div>
    <!-- 社交链接（来自 users.socials，常见平台用 FA 图标） -->
    <div v-if="socialLinks.length" class="profile-panel__socials-wrap">
      <div class="profile-panel__socials">
        <a
          v-for="s in socialLinks"
          :key="s.name + s.url"
          :href="s.url"
          target="_blank"
          rel="noopener noreferrer"
          class="profile-panel__social"
          :title="s.name"
        >
          <u-icon v-if="socialIcon(s)" :icon="socialIcon(s)!" class="profile-panel__social-fa" />
          <img v-else-if="s.icon" :src="s.icon" class="profile-panel__social-icon" :alt="s.name" />
          <u-icon v-else icon="fa-solid fa-link" class="profile-panel__social-fa" />
          <span class="profile-panel__social-label">{{ s.name }}</span>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores/model/user'
import { storeToRefs } from 'pinia'

defineOptions({ name: 'ProfilePanel' })

const { t } = useI18n()
const { user } = storeToRefs(useUserStore())

const displayName = computed(() => user.value?.namec || user.value?.username || t('profile.owner'))

const roleLabel = computed(() => {
  const map: Record<string, string> = {
    super_admin: t('profile.roleSuperAdmin'),
    admin: t('profile.roleAdmin'),
    user: t('profile.roleUser'),
  }
  return map[user.value?.role as string] ?? user.value?.role ?? ''
})

const socialLinks = computed(() => {
  const raw = user.value?.socials
  if (!Array.isArray(raw)) return []
  return raw.filter((s: any) => s?.url && s?.name)
})

/** 常见平台名 -> Font Awesome 品牌图标，无则用后端 icon 或默认 link */
const SOCIAL_FA_ICONS: Record<string, string> = {
  github: 'fa-brands fa-github',
  twitter: 'fa-brands fa-x-twitter',
  x: 'fa-brands fa-x-twitter',
  weibo: 'fa-brands fa-weibo',
  zhihu: 'fa-brands fa-zhihu',
  linkedin: 'fa-brands fa-linkedin',
  bilibili: 'fa-brands fa-bilibili',
  youtube: 'fa-brands fa-youtube',
  telegram: 'fa-brands fa-telegram',
  discord: 'fa-brands fa-discord',
  rss: 'fa-solid fa-rss',
}

function socialIcon(s: { name: string }): string | undefined {
  const key = (s.name ?? '').toLowerCase().replace(/\s+/g, '')
  return SOCIAL_FA_ICONS[key]
}

function formatDate(v: string | Date): string {
  const d = typeof v === 'string' ? new Date(v) : v
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
</script>

<style lang="scss" scoped>
.profile-panel {
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;

  &__avatar-wrap { margin-bottom: 4px; }

  &__avatar {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    object-fit: cover;
    &--placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--u-background-2);
      color: var(--u-text-3);
    }
  }

  &__name {
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--u-text-1);
    display: block;
  }

  &__role {
    font-size: 1.2rem;
    color: var(--u-text-3);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__bio {
    font-size: 1.3rem;
    color: var(--u-text-2);
    text-align: center;
    line-height: 1.6;
    display: block;
    margin: 4px 0;
  }

  /* 信息项：位置、邮箱、注册日期 */
  &__meta {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 8px;
    padding-top: 12px;
    border-top: 1px solid var(--u-border-1);
  }

  &__meta-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1.3rem;
    color: var(--u-text-2);
    padding: 6px 8px;
    border-radius: 4px;
    .u-icon { width: 14px; text-align: center; color: var(--u-text-3); }
  }

  /* 社交链接 */
  &__socials-wrap {
    width: 100%;
    margin-top: 4px;
    padding-top: 12px;
    border-top: 1px solid var(--u-border-1);
  }

  &__socials {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__social {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 1.2rem;
    color: var(--u-text-2);
    text-decoration: none;
    background: var(--u-background-2);
    transition: background 0.15s, color 0.15s;
    &:hover {
      background: var(--u-primary-light-7);
      color: var(--u-primary-0);
    }
  }

  &__social-fa {
    width: 1.6rem;
    text-align: center;
    font-size: 1.4rem;
  }

  &__social-icon {
    width: 16px;
    height: 16px;
    border-radius: 2px;
    flex-shrink: 0;
  }

  &__social-label {
    white-space: nowrap;
  }
}
</style>
