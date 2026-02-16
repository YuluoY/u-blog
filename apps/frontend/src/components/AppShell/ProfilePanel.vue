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
        <span>注册于 {{ formatDate(user.createdAt) }}</span>
      </div>
    </div>
    <!-- 社交链接（来自 users.socials jsonb） -->
    <div v-if="socialLinks.length" class="profile-panel__socials">
      <a
        v-for="s in socialLinks"
        :key="s.name"
        :href="s.url"
        target="_blank"
        rel="noopener noreferrer"
        class="profile-panel__social"
        :title="s.name"
      >
        <img v-if="s.icon" :src="s.icon" class="profile-panel__social-icon" :alt="s.name" />
        <span>{{ s.name }}</span>
      </a>
    </div>
    <!-- 个人网站（来自 users.website jsonb） -->
    <a
      v-if="websiteUrl"
      :href="websiteUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="profile-panel__website"
    >
      <u-icon icon="fa-solid fa-globe" />
      <span>{{ websiteTitle }}</span>
    </a>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/model/user'
import { storeToRefs } from 'pinia'

defineOptions({ name: 'ProfilePanel' })

const { user } = storeToRefs(useUserStore())

const displayName = computed(() => user.value?.namec || user.value?.username || '站长')

const roleLabel = computed(() => {
  const map: Record<string, string> = {
    super_admin: '超级管理员',
    admin: '管理员',
    user: '用户',
  }
  return map[user.value?.role as string] ?? user.value?.role ?? ''
})

const socialLinks = computed(() => {
  const raw = user.value?.socials
  if (!Array.isArray(raw)) return []
  return raw.filter((s: any) => s?.url && s?.name)
})

const websiteUrl = computed(() => {
  const w = user.value?.website as any
  return w?.url ?? null
})

const websiteTitle = computed(() => {
  const w = user.value?.website as any
  return w?.title || w?.url || '个人网站'
})

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
  &__socials {
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 4px;
    padding-top: 12px;
    border-top: 1px solid var(--u-border-1);
  }

  &__social {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 1.2rem;
    color: var(--u-text-2);
    text-decoration: none;
    background: var(--u-background-2);
    transition: background 0.15s;
    &:hover {
      background: var(--u-primary-light-7);
      color: var(--u-primary-0);
    }
  }

  &__social-icon {
    width: 14px;
    height: 14px;
    border-radius: 2px;
  }

  /* 个人网站 */
  &__website {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px;
    border-radius: 6px;
    font-size: 1.3rem;
    color: var(--u-primary-0);
    text-decoration: none;
    border: 1px solid var(--u-border-1);
    transition: background 0.15s;
    &:hover {
      background: var(--u-primary-light-7);
    }
  }
}
</style>
