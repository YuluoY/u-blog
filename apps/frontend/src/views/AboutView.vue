<template>
  <u-layout :padding="24">
    <u-region region="center">
      <u-card class="about-card" shadow="hover">
        <template #header>
          <u-text class="about-card__title">关于本站</u-text>
        </template>
        <div class="about-card__body">
          <div class="about-card__avatar-wrap">
            <img
              v-if="user?.avatar"
              class="about-card__avatar"
              :src="user.avatar"
              :alt="displayName"
            />
            <div v-else class="about-card__avatar about-card__avatar--placeholder">
              <u-icon icon="fa-solid fa-user" size="2x" />
            </div>
          </div>
          <u-text class="about-card__name">{{ displayName }}</u-text>
          <u-text v-if="user?.bio" class="about-card__bio">{{ user.bio }}</u-text>
          <div v-if="user?.location" class="about-card__meta">
            <u-icon icon="fa-solid fa-location-dot" />
            <span>{{ user.location }}</span>
          </div>
          <div v-if="socialLinks.length" class="about-card__socials">
            <a
              v-for="s in socialLinks"
              :key="s.name"
              :href="s.url"
              target="_blank"
              rel="noopener noreferrer"
              class="about-card__social"
            >
              <u-icon v-if="s.icon && s.icon.startsWith('fa-')" :icon="s.icon" />
              <img v-else-if="s.icon" :src="s.icon" class="about-card__social-img" :alt="s.name" />
              <span>{{ s.name }}</span>
            </a>
          </div>
          <a
            v-if="websiteUrl"
            :href="websiteUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="about-card__website"
          >
            <u-icon icon="fa-solid fa-globe" />
            <span>{{ websiteTitle }}</span>
          </a>
        </div>
      </u-card>
    </u-region>
  </u-layout>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/model/user'
import { storeToRefs } from 'pinia'

defineOptions({ name: 'AboutView' })

const { user } = storeToRefs(useUserStore())

const displayName = computed(() => user.value?.namec || user.value?.username || '站长')

const socialLinks = computed(() => {
  const raw = user.value?.socials
  if (!Array.isArray(raw)) return []
  return raw.filter((s: { url?: string; name?: string }) => s?.url && s?.name)
})

const websiteUrl = computed(() => {
  const w = user.value?.website as { url?: string } | undefined
  return w?.url ?? null
})

const websiteTitle = computed(() => {
  const w = user.value?.website as { title?: string; url?: string } | undefined
  return w?.title || w?.url || '个人网站'
})
</script>

<style lang="scss" scoped>
.about-card {
  max-width: 560px;
  margin: 0 auto;
  border-radius: 12px;
  overflow: hidden;

  :deep(.u-card__header) {
    padding: 24px 24px 0;
    border-bottom: none;
  }
  :deep(.u-card__body) {
    padding: 24px;
  }

  &__title {
    font-size: 2rem;
    font-weight: 700;
    color: var(--u-text-1);
    letter-spacing: 0.02em;
  }

  &__body {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  &__avatar-wrap {
    margin-bottom: 8px;
  }

  &__avatar {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid var(--u-border-1);
    &--placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--u-background-2);
      color: var(--u-text-3);
      border: 3px solid var(--u-border-1);
    }
  }

  &__name {
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--u-text-1);
  }

  &__bio {
    font-size: 1.45rem;
    color: var(--u-text-2);
    text-align: center;
    line-height: 1.7;
    max-width: 400px;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1.35rem;
    color: var(--u-text-3);
    padding: 8px 0;
  }

  &__socials {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    justify-content: center;
    padding-top: 8px;
  }

  &__social {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border-radius: 10px;
    font-size: 1.35rem;
    color: var(--u-text-2);
    text-decoration: none;
    background: var(--u-background-2);
    transition: background 0.2s, color 0.2s, transform 0.15s;
    &:hover {
      background: var(--u-primary-light-7);
      color: var(--u-primary-0);
      transform: translateY(-1px);
    }
  }

  &__social-img {
    width: 20px;
    height: 20px;
    border-radius: 4px;
  }

  &__website {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: 10px;
    font-size: 1.35rem;
    color: var(--u-primary-0);
    text-decoration: none;
    border: 1px solid var(--u-primary-0);
    transition: background 0.2s, transform 0.15s;
    &:hover {
      background: var(--u-primary-light-7);
      transform: translateY(-1px);
    }
  }
}
</style>
