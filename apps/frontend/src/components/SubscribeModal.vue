<template>
  <!-- 使用 UDialog 组件，自动跟随主题色 -->
  <u-dialog
    v-model="dialogVisible"
    :title="submitted ? '' : t('subscribe.title')"
    :width="400"
    :height="380"
    modal
    :show-footer="false"
    :close-on-click-modal="true"
    :close-on-press-escape="true"
    :z-index="9999"
    class="subscribe-dialog"
  >
    <!-- 成功状态 -->
    <div v-if="submitted" class="subscribe-dialog__success">
      <u-icon icon="fa-solid fa-envelope-circle-check" class="subscribe-dialog__success-icon" />
      <u-text class="subscribe-dialog__success-title">{{ t('subscribe.successTitle') }}</u-text>
      <u-text class="subscribe-dialog__success-desc">{{ t('subscribe.successDesc') }}</u-text>
      <u-button type="primary" :round="8" class="subscribe-dialog__action-btn" @click="dialogVisible = false">
        {{ t('common.confirm') }}
      </u-button>
    </div>

    <!-- 表单状态 -->
    <div v-else class="subscribe-dialog__body">
      <div class="subscribe-dialog__header">
        <u-icon icon="fa-solid fa-bell" class="subscribe-dialog__bell" />
        <u-text class="subscribe-dialog__desc">{{ t('subscribe.desc') }}</u-text>
      </div>
      <form class="subscribe-dialog__form" @submit.prevent="handleSubmit">
        <div class="subscribe-dialog__field">
          <u-text class="subscribe-dialog__label">{{ t('subscribe.email') }}</u-text>
          <u-input
            v-model="email"
            :placeholder="t('subscribe.emailPlaceholder')"
            prefix-icon="fa-solid fa-envelope"
          />
        </div>
        <div class="subscribe-dialog__field">
          <u-text class="subscribe-dialog__label">
            {{ t('subscribe.name') }}
            <span class="subscribe-dialog__optional">{{ t('common.optional') }}</span>
          </u-text>
          <u-input
            v-model="name"
            :placeholder="t('subscribe.namePlaceholder')"
            prefix-icon="fa-solid fa-user"
          />
        </div>
        <u-text v-if="errorMsg" class="subscribe-dialog__error">{{ errorMsg }}</u-text>
        <u-button
          type="primary"
          :round="8"
          :loading="loading"
          :disabled="!email.trim()"
          native-type="submit"
          class="subscribe-dialog__action-btn"
        >
          {{ loading ? t('subscribe.submitting') : t('subscribe.submit') }}
        </u-button>
      </form>
    </div>
  </u-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { subscribeEmail } from '@/api/subscribe'

defineOptions({ name: 'SubscribeModal' })

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ (e: 'update:visible', val: boolean): void }>()

const { t } = useI18n({ useScope: 'global' })

/** 双向绑定 UDialog 的 v-model */
const dialogVisible = computed({
  get: () => props.visible,
  set: (val: boolean) => emit('update:visible', val),
})

const email = ref('')
const name = ref('')
const loading = ref(false)
const errorMsg = ref('')
const submitted = ref(false)

// 弹窗打开时重置表单
watch(() => props.visible, (v) => {
  if (v) {
    email.value = ''
    name.value = ''
    errorMsg.value = ''
    submitted.value = false
    loading.value = false
  }
})

async function handleSubmit() {
  if (!email.value.trim()) return
  loading.value = true
  errorMsg.value = ''
  try {
    await subscribeEmail(email.value.trim(), name.value.trim() || undefined)
    submitted.value = true
  } catch (err: any) {
    errorMsg.value = err?.message || t('subscribe.failed')
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
/* 订阅弹窗内部布局 — 所有颜色走 CSS 变量，自动跟随主题 */
.subscribe-dialog {
  &__body {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__header {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  &__bell {
    font-size: 2.8rem;
    color: var(--u-primary-0);
  }

  &__desc {
    font-size: 1.3rem;
    color: var(--u-text-3);
    display: block;
    line-height: 1.5;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__label {
    font-size: 1.3rem;
    font-weight: 500;
    color: var(--u-text-2);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__optional {
    font-size: 1.1rem;
    color: var(--u-text-3);
    font-weight: 400;
  }

  &__error {
    font-size: 1.2rem;
    color: var(--u-danger, #e74c3c);
    display: block;
  }

  &__action-btn {
    width: 100%;
    margin-top: 4px;
  }

  /* 成功界面 */
  &__success {
    text-align: center;
    padding: 16px 0 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  &__success-icon {
    font-size: 3.6rem;
    color: var(--u-success, #27ae60);
  }

  &__success-title {
    font-size: 1.8rem;
    font-weight: 700;
    color: var(--u-text-1);
    display: block;
  }

  &__success-desc {
    font-size: 1.3rem;
    color: var(--u-text-3);
    display: block;
    line-height: 1.5;
  }
}

/* 修复 UDialog body overflow 截断内容的问题 */
:deep(.u-dialog) {
  overflow: visible;
}
:deep(.u-dialog__body) {
  overflow: visible;
}
</style>
