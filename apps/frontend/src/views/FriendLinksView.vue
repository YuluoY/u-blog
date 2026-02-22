<template>
  <div class="links-page">
    <!-- 页面 Hero -->
    <header class="links-page__hero">
      <div class="links-page__hero-content">
        <h1 class="links-page__title">{{ t('friendLinks.title') }}</h1>
        <u-text type="info" size="small">{{ t('friendLinks.desc') }}</u-text>
      </div>
      <div class="links-page__stats">
        <div class="links-page__stat">
          <span class="links-page__stat-num">{{ links.length }}</span>
          <span class="links-page__stat-label">{{ t('friendLinks.count') }}</span>
        </div>
      </div>
    </header>

    <!-- 友链卡片列表 -->
    <section class="links-page__grid">
      <div v-if="loading" class="links-page__loading">
        <u-icon icon="fa-solid fa-spinner" spin />
      </div>
      <template v-else-if="links.length > 0">
        <a
          v-for="link in links"
          :key="link.id"
          :href="link.url"
          target="_blank"
          rel="noopener noreferrer"
          class="links-page__card"
        >
          <div class="links-page__card-icon">
            <u-image
              v-if="link.icon"
              :src="link.icon"
              :alt="link.title"
              fit="cover"
              :width="48"
              :height="48"
            >
              <template #error>
                <span class="links-page__card-letter">{{ link.title.charAt(0).toUpperCase() }}</span>
              </template>
            </u-image>
            <span v-else class="links-page__card-letter">{{ link.title.charAt(0).toUpperCase() }}</span>
          </div>
          <div class="links-page__card-body">
            <u-text tag="h3" ellipsis class="links-page__card-title">{{ link.title }}</u-text>
            <u-text type="info" size="small" ellipsis>{{ link.description || link.url }}</u-text>
          </div>
        </a>
      </template>
      <div v-else class="links-page__empty">
        <u-icon icon="fa-solid fa-link" />
        <span>{{ t('friendLinks.empty') }}</span>
      </div>
    </section>

    <!-- 申请 / 管理按钮 -->
    <section class="links-page__actions">
      <u-button type="primary" icon="fa-solid fa-plus" @click="showForm = true">
        {{ t('friendLinks.submit') }}
      </u-button>
      <u-button
        v-if="isLoggedIn"
        plain
        icon="fa-solid fa-gear"
        @click="showManage = !showManage"
      >
        {{ t('friendLinks.manage') }}
      </u-button>
    </section>

    <!-- 申请友链弹窗（UDialog） -->
    <u-dialog
      v-model="showForm"
      :title="t('friendLinks.formTitle')"
      :width="520"
      :height="620"
      modal
      :show-footer="true"
    >
      <!-- 弹窗主体：表单 -->
      <u-form ref="formRef" :model="form" :rules="formRules" label-position="top">
        <!-- URL + 自动获取 -->
        <u-form-item :label="t('friendLinks.formUrl')" prop="url">
          <div class="links-page__form-row">
            <u-input
              v-model="form.url"
              :placeholder="t('friendLinks.formUrlPlaceholder')"
              prefix-icon="fa-solid fa-globe"
              @blur="handleUrlBlur"
            />
            <u-button
              plain
              size="small"
              :loading="fetching"
              :disabled="!form.url"
              @click="handleAutoFetch"
            >
              {{ fetching ? t('friendLinks.autoFetching') : t('friendLinks.autoFetch') }}
            </u-button>
          </div>
        </u-form-item>

        <!-- 站点名称 -->
        <u-form-item :label="t('friendLinks.formSiteName')" prop="title">
          <u-input
            v-model="form.title"
            :placeholder="t('friendLinks.formSiteNamePlaceholder')"
            prefix-icon="fa-solid fa-heading"
          />
        </u-form-item>

        <!-- 图标 -->
        <u-form-item :label="t('friendLinks.formIcon')" prop="icon">
          <div class="links-page__form-icon-row">
            <u-image
              v-if="form.icon"
              :src="form.icon"
              alt="icon"
              :width="32"
              :height="32"
              :radius="6"
              fit="cover"
            >
              <template #error>
                <u-icon icon="fa-solid fa-image" />
              </template>
            </u-image>
            <u-input
              v-model="form.icon"
              :placeholder="t('friendLinks.formIconPlaceholder')"
              prefix-icon="fa-solid fa-image"
            />
          </div>
        </u-form-item>

        <!-- 描述 -->
        <u-form-item :label="t('friendLinks.formDesc')" prop="description">
          <u-input
            v-model="form.description"
            :placeholder="t('friendLinks.formDescPlaceholder')"
            prefix-icon="fa-solid fa-align-left"
          />
        </u-form-item>

        <!-- 邮箱 -->
        <u-form-item :label="t('friendLinks.formEmail')" prop="email">
          <u-input
            v-model="form.email"
            :placeholder="t('friendLinks.formEmailPlaceholder')"
            prefix-icon="fa-solid fa-envelope"
          />
        </u-form-item>
      </u-form>

      <!-- 自定义底部按钮 -->
      <template #footer>
        <u-button plain @click="showForm = false">{{ t('common.cancel') }}</u-button>
        <u-button
          type="primary"
          :loading="submitting"
          :disabled="!form.url || !form.title"
          @click="handleSubmit"
        >
          {{ t('friendLinks.submit') }}
        </u-button>
      </template>
    </u-dialog>

    <!-- 友链管理面板（仅博主可见） -->
    <section v-if="showManage && isLoggedIn" class="links-page__manage">
      <h3 class="links-page__manage-title">{{ t('friendLinks.manage') }}</h3>
      <div v-if="manageLoading" class="links-page__loading">
        <u-icon icon="fa-solid fa-spinner" spin />
      </div>
      <div v-else-if="manageList.length === 0" class="links-page__empty">
        <span>{{ t('friendLinks.empty') }}</span>
      </div>
      <div v-else class="links-page__manage-list">
        <u-card
          v-for="link in manageList"
          :key="link.id"
          :padding="12"
          shadow="hover"
          class="links-page__manage-item"
          :class="'links-page__manage-item--' + link.status"
        >
          <div class="links-page__manage-item-inner">
            <div class="links-page__manage-item-info">
              <u-image
                v-if="link.icon"
                :src="link.icon"
                alt=""
                :width="32"
                :height="32"
                :radius="6"
                fit="cover"
              >
                <template #error>
                  <u-icon icon="fa-solid fa-globe" />
                </template>
              </u-image>
              <div>
                <u-text ellipsis class="links-page__manage-item-title">{{ link.title }}</u-text>
                <u-text type="info" size="small" ellipsis>{{ link.url }}</u-text>
              </div>
            </div>
            <div class="links-page__manage-item-status">
              <u-tag
                :type="statusTagType(link.status)"
                size="small"
                effect="light"
              >
                {{ t('friendLinks.' + link.status) }}
              </u-tag>
            </div>
            <div class="links-page__manage-item-actions">
              <template v-if="link.status === 'pending'">
                <u-button type="success" size="small" plain @click="handleReview(link.id, 'approve')">
                  {{ t('friendLinks.approve') }}
                </u-button>
                <u-button type="warning" size="small" plain @click="handleReview(link.id, 'reject')">
                  {{ t('friendLinks.reject') }}
                </u-button>
              </template>
              <u-button type="danger" size="small" plain @click="handleDelete(link.id)">
                {{ t('friendLinks.delete') }}
              </u-button>
            </div>
          </div>
        </u-card>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@/stores/model/user'
import { UMessageFn, type FormRules, type UFormExposes } from '@u-blog/ui'
import { storeToRefs } from 'pinia'
import type { IFriendLink } from '@u-blog/model'
import {
  getFriendLinks,
  getMyFriendLinks,
  submitFriendLink,
  reviewFriendLink,
  deleteFriendLink,
  fetchSiteMeta,
} from '@/api/friendLink'

defineOptions({ name: 'FriendLinksView' })

const { t } = useI18n()
const { user, isLoggedIn } = storeToRefs(useUserStore())

/** 状态 → UTag type 映射 */
function statusTagType(status: string): 'warning' | 'success' | 'danger' {
  if (status === 'approved') return 'success'
  if (status === 'rejected') return 'danger'
  return 'warning'
}

/* ---------- 公开友链列表 ---------- */
const links = ref<IFriendLink[]>([])
const loading = ref(false)

/** 加载当前站点的已审核友链（使用 super_admin 的 userId 作为默认博主） */
async function loadLinks() {
  loading.value = true
  try {
    // 若已登录则显示自己的友链，否则显示站长（userId=1）的友链
    const userId = user.value?.id ?? 1
    links.value = await getFriendLinks(userId)
  } catch {
    links.value = []
  } finally {
    loading.value = false
  }
}

/* ---------- 申请友链表单 ---------- */
const showForm = ref(false)
const submitting = ref(false)
const fetching = ref(false)
const formRef = ref<UFormExposes | null>(null)
const form = reactive({
  url: '',
  title: '',
  icon: '',
  description: '',
  email: '',
})

/** 表单校验规则 */
const formRules = computed<FormRules>(() => ({
  url: [{ required: true, message: t('friendLinks.formUrlPlaceholder'), trigger: 'blur' }],
  title: [{ required: true, message: t('friendLinks.formSiteNamePlaceholder'), trigger: 'blur' }],
}))

/** URL 失焦自动抓取 */
function handleUrlBlur() {
  if (form.url && !form.title) {
    handleAutoFetch()
  }
}

/** 自动获取站点 meta 信息 */
async function handleAutoFetch() {
  if (!form.url || fetching.value) return
  // 补全协议
  let url = form.url.trim()
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url
  form.url = url
  fetching.value = true
  try {
    const meta = await fetchSiteMeta(url)
    if (meta.title && !form.title) form.title = meta.title
    if (meta.icon && !form.icon) form.icon = meta.icon
    if (meta.description && !form.description) form.description = meta.description
  } catch {
    UMessageFn({ type: 'warning', message: t('friendLinks.autoFetchFailed') })
  } finally {
    fetching.value = false
  }
}

/** 提交友链申请 */
async function handleSubmit() {
  // 使用 UForm 校验
  formRef.value?.validate(async (valid) => {
    if (!valid) return
    submitting.value = true
    try {
      const userId = user.value?.id ?? 1
      await submitFriendLink({
        userId,
        url: form.url.trim(),
        title: form.title.trim(),
        icon: form.icon.trim() || undefined,
        description: form.description.trim() || undefined,
        email: form.email.trim() || undefined,
      })
      UMessageFn({ type: 'success', message: t('friendLinks.submitSuccess') })
      showForm.value = false
      // 重置表单
      formRef.value?.resetFields()
      // 如果是博主提交给自己，直接刷新列表
      if (isLoggedIn.value) loadLinks()
    } catch (err: any) {
      UMessageFn({ type: 'error', message: err?.message || t('friendLinks.submitFailed') })
    } finally {
      submitting.value = false
    }
  })
}

/* ---------- 友链管理（博主） ---------- */
const showManage = ref(false)
const manageLoading = ref(false)
const manageList = ref<IFriendLink[]>([])

/** 加载博主自己的全部友链 */
async function loadManageList() {
  manageLoading.value = true
  try {
    manageList.value = await getMyFriendLinks()
  } catch {
    manageList.value = []
  } finally {
    manageLoading.value = false
  }
}

/** 审核友链 */
async function handleReview(id: number, action: 'approve' | 'reject') {
  try {
    await reviewFriendLink(id, action)
    await loadManageList()
    await loadLinks()
  } catch (err: any) {
    UMessageFn({ type: 'error', message: err?.message || '操作失败' })
  }
}

/** 删除友链 */
async function handleDelete(id: number) {
  try {
    await deleteFriendLink(id)
    await loadManageList()
    await loadLinks()
  } catch (err: any) {
    UMessageFn({ type: 'error', message: err?.message || '删除失败' })
  }
}

/* ---------- 监听管理面板展开 ---------- */
watch(showManage, (val) => {
  if (val) loadManageList()
})

onMounted(() => {
  loadLinks()
})
</script>

<style lang="scss" scoped>
.links-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 16px 40px;

  /* Hero 区域 */
  &__hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 32px 0 24px;
    border-bottom: 1px solid var(--u-border-color, #eee);
    margin-bottom: 24px;
  }
  &__title {
    font-size: 28px;
    font-weight: 700;
    margin: 0;
    color: var(--u-text-2, #333);
  }
  &__stats {
    flex-shrink: 0;
  }
  &__stat {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  &__stat-num {
    font-size: 28px;
    font-weight: 700;
    color: var(--u-primary-color, #667eea);
    line-height: 1;
  }
  &__stat-label {
    font-size: 12px;
    color: var(--u-text-color-secondary, #999);
    margin-top: 4px;
  }

  /* 卡片网格 */
  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 16px;
    margin-bottom: 32px;
  }
  &__loading,
  &__empty {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 48px 0;
    color: var(--u-text-color-secondary, #999);
    font-size: 14px;
  }

  /* 单个友链卡片 */
  &__card {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    border-radius: 12px;
    border: 1px solid var(--u-border-color, #eee);
    background: var(--u-bg-color, #fff);
    text-decoration: none;
    color: inherit;
    transition: all 0.25s ease;
    cursor: pointer;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.15);
      border-color: var(--u-primary-color, #667eea);
    }
  }
  &__card-icon {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    border-radius: 10px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
  &__card-letter {
    font-size: 20px;
    font-weight: 700;
    color: #fff;
  }
  &__card-body {
    flex: 1;
    min-width: 0;
  }
  &__card-title {
    font-size: 15px;
    font-weight: 600;
    margin: 0;
  }

  /* 操作按钮区 */
  &__actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-bottom: 32px;
  }

  /* 表单辅助布局 */
  &__form-row {
    display: flex;
    gap: 8px;
  }
  &__form-icon-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* 管理面板 */
  &__manage {
    border-top: 1px solid var(--u-border-color, #eee);
    padding-top: 24px;
    margin-top: 16px;
  }
  &__manage-title {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 16px;
    color: var(--u-text-color, #333);
  }
  &__manage-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  &__manage-item {
    &--pending { border-left: 3px solid #e6a23c; }
    &--approved { border-left: 3px solid #67c23a; }
    &--rejected { border-left: 3px solid #f56c6c; }
  }
  &__manage-item-inner {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
  }
  &__manage-item-info {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }
  &__manage-item-status {
    flex-shrink: 0;
  }
  &__manage-item-actions {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  }
}

/* 响应式 */
@media (max-width: 640px) {
  .links-page {
    &__grid {
      grid-template-columns: 1fr;
    }
    &__hero {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
    &__manage-item {
      flex-wrap: wrap;
    }
    &__manage-item-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
}
</style>
