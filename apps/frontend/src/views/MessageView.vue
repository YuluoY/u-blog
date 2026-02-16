<template>
  <u-layout :padding="24">
    <u-region region="center">
      <u-card class="message-card" shadow="hover">
        <template #header>
          <u-text class="message-card__title">留言板</u-text>
          <u-text class="message-card__subtitle">欢迎留下你的足迹</u-text>
        </template>
        <div class="message-card__form">
          <template v-if="user?.id">
            <u-input
              v-model="content"
              type="textarea"
              placeholder="写下你想说的..."
              :rows="4"
              :max-length="500"
              show-word-limit
            />
            <u-button type="primary" :loading="submitting" @click="handleSubmit">发表留言</u-button>
          </template>
          <u-text v-else class="message-card__login-hint">登录后可发表留言</u-text>
        </div>
        <div class="message-card__list">
          <template v-if="loading">
            <div class="message-card__loading">
              <u-icon icon="fa-solid fa-spinner" spin />
              <u-text>加载中...</u-text>
            </div>
          </template>
          <template v-else-if="!list.length">
            <u-text class="message-card__empty">暂无留言，快来抢沙发吧～</u-text>
          </template>
          <div v-else v-for="c in list" :key="c.id" class="message-item">
            <div class="message-item__head">
              <span class="message-item__author">{{ (c.user as any)?.namec || (c.user as any)?.username || '匿名' }}</span>
              <span class="message-item__time">{{ formatTime(c.createdAt) }}</span>
            </div>
            <u-text class="message-item__content">{{ c.content }}</u-text>
          </div>
        </div>
      </u-card>
    </u-region>
  </u-layout>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/model/user'
import api from '@/api'
import { CTable } from '@u-blog/model'
import type { IComment } from '@u-blog/model'
import { storeToRefs } from 'pinia'

defineOptions({ name: 'MessageView' })

const MESSAGE_PATH = '/message'

const { user } = storeToRefs(useUserStore())
const content = ref('')
const list = ref<IComment[]>([])
const loading = ref(false)
const submitting = ref(false)

function formatTime(v: string | Date) {
  const d = typeof v === 'string' ? new Date(v) : v
  return d.toLocaleString('zh-CN')
}

async function fetchList() {
  loading.value = true
  try {
    list.value = await api(CTable.COMMENT).getCommentList(MESSAGE_PATH)
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  const text = content.value?.trim()
  if (!text || !user.value?.id) return
  submitting.value = true
  try {
    await api(CTable.COMMENT).addComment({
      content: text,
      path: MESSAGE_PATH,
      userId: user.value.id as number,
    })
    content.value = ''
    await fetchList()
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchList()
})
</script>

<style lang="scss" scoped>
.message-card {
  max-width: 720px;
  margin: 0 auto;
  border-radius: 12px;
  overflow: hidden;

  :deep(.u-card__header) {
    padding: 24px 24px 8px;
  }
  :deep(.u-card__body) {
    padding: 24px;
  }

  &__title {
    font-size: 2rem;
    font-weight: 700;
    color: var(--u-text-1);
    display: block;
  }

  &__subtitle {
    font-size: 1.35rem;
    color: var(--u-text-4);
    display: block;
    margin-top: 6px;
  }

  &__form {
    padding-bottom: 24px;
    border-bottom: 1px solid var(--u-border-1);
    margin-bottom: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__login-hint {
    font-size: 1.3rem;
    color: var(--u-text-3);
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__loading,
  &__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 32px;
    color: var(--u-text-3);
    font-size: 1.3rem;
  }
}

.message-item {
  padding: 12px;
  border-radius: 8px;
  background: var(--u-background-2);

  &__head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  &__author {
    font-size: 1.3rem;
    font-weight: 600;
    color: var(--u-text-1);
  }

  &__time {
    font-size: 1.2rem;
    color: var(--u-text-4);
  }

  &__content {
    font-size: 1.4rem;
    color: var(--u-text-2);
    line-height: 1.6;
    white-space: pre-wrap;
  }
}
</style>
