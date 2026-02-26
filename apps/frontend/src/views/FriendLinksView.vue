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
          v-for="(link, index) in links"
          :key="link.id"
          :href="link.url"
          target="_blank"
          rel="noopener noreferrer"
          class="links-page__card"
          :style="{ '--card-delay': index * 60 + 'ms' }"
        >
          <!-- 装饰性渐变条 -->
          <div class="links-page__card-accent" />
          <div class="links-page__card-content">
            <div class="links-page__card-avatar">
              <u-image
                v-if="link.icon"
                :src="link.icon"
                :alt="link.title"
                fit="cover"
                :width="52"
                :height="52"
              >
                <template #error>
                  <span class="links-page__card-letter">{{ link.title.charAt(0).toUpperCase() }}</span>
                </template>
              </u-image>
              <span v-else class="links-page__card-letter">{{ link.title.charAt(0).toUpperCase() }}</span>
            </div>
            <div class="links-page__card-info">
              <h3 class="links-page__card-title">{{ link.title }}</h3>
              <p class="links-page__card-desc">{{ link.description || link.url }}</p>
            </div>
            <u-icon class="links-page__card-arrow" icon="fa-solid fa-arrow-up-right-from-square" />
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
import { useBlogOwnerStore } from '@/stores/blogOwner'
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
const blogOwnerStore = useBlogOwnerStore()

/** 状态 → UTag type 映射 */
function statusTagType(status: string): 'warning' | 'success' | 'danger' {
  if (status === 'approved') return 'success'
  if (status === 'rejected') return 'danger'
  return 'warning'
}

/* ---------- 公开友链列表 ---------- */
const links = ref<IFriendLink[]>([])
const loading = ref(false)

/** 加载当前站点的已审核友链（子域名模式优先使用博客拥有者 ID） */
async function loadLinks() {
  loading.value = true
  try {
    // 子域名模式 → 博客拥有者的友链，否则当前登录用户 / 站长（userId=1）
    const userId = blogOwnerStore.isSubdomainMode && blogOwnerStore.blogOwnerId
      ? blogOwnerStore.blogOwnerId
      : (user.value?.id ?? 1)
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
      const userId = blogOwnerStore.isSubdomainMode && blogOwnerStore.blogOwnerId
        ? blogOwnerStore.blogOwnerId
        : (user.value?.id ?? 1)
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
  max-width: 960px;
  margin: 0 auto;
  padding: 0 20px 48px;

  /* ========== Hero 区域 ========== */
  &__hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 36px 0 28px;
    border-bottom: 1px solid var(--u-border-1);
    margin-bottom: 28px;
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
    color: var(--u-primary);
    line-height: 1;
  }
  &__stat-label {
    font-size: 12px;
    color: var(--u-text-3);
    margin-top: 4px;
  }

  /* ========== 卡片网格 ========== */
  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
    margin-bottom: 36px;
  }
  &__loading,
  &__empty {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 56px 0;
    color: var(--u-text-3);
    font-size: 14px;
  }

  /* ========== 友链卡片 ========== */
  &__card {
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
    border-radius: 16px;
    border: 1px solid var(--u-border-1);
    background: var(--u-background-1);
    text-decoration: none;
    color: inherit;
    cursor: pointer;
    animation: card-fade-in 0.4s ease both;
    animation-delay: var(--card-delay, 0ms);
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
                box-shadow 0.3s ease,
                border-color 0.3s ease;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 32px rgba(102, 126, 234, 0.18),
                  0 4px 12px rgba(0, 0, 0, 0.06);
      border-color: var(--u-primary);

      .links-page__card-accent {
        opacity: 1;
      }
      .links-page__card-arrow {
        opacity: 1;
        transform: translateX(0);
      }
      .links-page__card-avatar {
        transform: scale(1.05);
      }
    }
  }

  /* 顶部装饰渐变条 */
  &__card-accent {
    height: 3px;
    background: linear-gradient(90deg, var(--u-primary), var(--u-primary-1, #a78bfa), #60a5fa);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &__card-content {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 18px 20px;
  }

  /* 头像 */
  &__card-avatar {
    flex-shrink: 0;
    width: 52px;
    height: 52px;
    border-radius: 14px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--u-primary) 0%, var(--u-primary-1, #a78bfa) 100%);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
    transition: transform 0.3s ease;
  }

  &__card-letter {
    font-size: 22px;
    font-weight: 700;
    color: #fff;
    line-height: 1;
  }

  &__card-info {
    flex: 1;
    min-width: 0;
  }

  &__card-title {
    font-size: 15px;
    font-weight: 600;
    margin: 0 0 4px;
    color: var(--u-text-1);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__card-desc {
    font-size: 12px;
    margin: 0;
    color: var(--u-text-3);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.4;
  }

  /* 箭头图标 */
  &__card-arrow {
    flex-shrink: 0;
    font-size: 12px;
    color: var(--u-text-3);
    opacity: 0;
    transform: translateX(-6px);
    transition: opacity 0.25s ease, transform 0.25s ease;
  }

  /* ========== 操作按钮区 ========== */
  &__actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-bottom: 32px;
  }

  /* ========== 表单辅助布局 ========== */
  &__form-row {
    display: flex;
    gap: 8px;
  }
  &__form-icon-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* ========== 管理面板 ========== */
  &__manage {
    border-top: 1px solid var(--u-border-1);
    padding-top: 24px;
    margin-top: 16px;
  }
  &__manage-title {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 16px;
    color: var(--u-text-1);
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

/* 卡片入场动画 */
@keyframes card-fade-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式 */
@media (max-width: 640px) {
  .links-page {
    padding: 0 12px 32px;

    &__grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }
    &__hero {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
    &__card-content {
      padding: 14px 16px;
    }
    &__manage-item-inner {
      flex-wrap: wrap;
    }
    &__manage-item-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
}
</style>
