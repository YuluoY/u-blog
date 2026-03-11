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

    <!-- ========== 蜂窝布局友链列表 ========== -->
    <section
      ref="honeycombRef"
      class="honeycomb"
      :class="{ 'is-entered': hasEntered }"
      @click.self="activeId = null"
    >
      <div v-if="loading" class="honeycomb__loading">
        <u-icon icon="fa-solid fa-spinner" spin />
      </div>

      <template v-else-if="displayLinks.length > 0">
        <!-- 背景氛围层：极轻渐变光斑，跟随 hover 位置 -->
        <div
          class="honeycomb__ambient"
          :style="ambientStyle"
        />

        <div
          class="honeycomb__stage"
          :style="{ width: gridWidth + 'px', height: gridHeight + 'px' }"
        >
          <a
            v-for="(cell, index) in cellLayout"
            :key="cell.id"
            :href="cell.url"
            target="_blank"
            rel="noopener noreferrer"
            class="honeycomb__cell"
            :data-state="getNodeState(cell.id)"
            :style="{
              left: cell.x + 'px',
              top: cell.y + 'px',
              width: hexW + 'px',
              height: hexH + 'px',
              '--hex-hue': cell.hue,
              '--hex-enter-delay': Math.round(cell.normalizedDist * 400) + 'ms',
              '--hex-breathe-delay': (index * 800 % 6000) + 'ms',
            }"
            tabindex="0"
            @click.prevent
            @keydown.enter.prevent="onCellClick($event, cell)"
            @keydown.space.prevent="onCellClick($event, cell)"
          >
            <!-- 外发光层 -->
            <div class="honeycomb__glow" />
            <!-- 边框层 -->
            <div class="honeycomb__border" />
            <!-- 六边形主体 -->
            <div
              class="honeycomb__hex"
              @mouseenter="onCellEnter(cell.id)"
              @mouseleave="onCellLeave"
              @mousedown="onCellPress(cell.id)"
              @mouseup="onCellRelease"
              @touchstart.passive="onCellPress(cell.id)"
              @touchend="onCellRelease"
              @click.stop="onCellClick($event, cell)"
              @focus="onCellFocus(cell.id)"
              @blur="onCellBlur"
            >
              <div class="honeycomb__avatar">
                <u-image
                  v-if="cell.icon"
                  :src="cell.icon"
                  :alt="cell.title"
                  fit="cover"
                  :width="48"
                  :height="48"
                >
                  <template #error>
                    <span class="honeycomb__letter">{{ cell.title.charAt(0).toUpperCase() }}</span>
                  </template>
                </u-image>
                <span v-else class="honeycomb__letter">{{ cell.title.charAt(0).toUpperCase() }}</span>
              </div>
              <span class="honeycomb__name">{{ cell.title }}</span>
              <!-- 外链弱提示 -->
              <span class="honeycomb__ext-hint">
                <u-icon icon="fa-solid fa-arrow-up-right-from-square" />
              </span>
            </div>

            <!-- 桌面端悬浮提示 -->
            <Transition name="hex-tip">
              <div
                v-show="hoveredId === cell.id || focusedId === cell.id"
                class="honeycomb__tip"
                @mouseenter="onTipEnter"
                @mouseleave="onTipLeave"
              >
                <strong class="honeycomb__tip-title">{{ cell.title }}</strong>
                <p v-if="cell.description" class="honeycomb__tip-desc">{{ cell.description }}</p>
                <span class="honeycomb__tip-url">
                  <u-icon icon="fa-solid fa-arrow-up-right-from-square" />
                  {{ cell.url }}
                </span>
              </div>
            </Transition>
          </a>
        </div>
      </template>

      <div v-else class="honeycomb__empty">
        <u-icon icon="fa-solid fa-link" />
        <span>{{ t('friendLinks.empty') }}</span>
      </div>

      <!-- 移动端详情浮层 -->
      <Transition name="hex-detail">
        <div v-if="activeCell" class="honeycomb__detail" @click.stop>
          <button class="honeycomb__detail-close" @click="activeId = null">
            <u-icon icon="fa-solid fa-xmark" />
          </button>
          <div class="honeycomb__detail-header">
            <div class="honeycomb__detail-avatar" :style="{ '--hex-hue': activeCell.hue }">
              <u-image
                v-if="activeCell.icon"
                :src="activeCell.icon"
                :alt="activeCell.title"
                fit="cover"
                :width="40"
                :height="40"
              >
                <template #error>
                  <span class="honeycomb__letter">{{ activeCell.title.charAt(0).toUpperCase() }}</span>
                </template>
              </u-image>
              <span v-else class="honeycomb__letter">{{ activeCell.title.charAt(0).toUpperCase() }}</span>
            </div>
            <div class="honeycomb__detail-info">
              <strong>{{ activeCell.title }}</strong>
              <p v-if="activeCell.description">{{ activeCell.description }}</p>
            </div>
          </div>
          <a
            class="honeycomb__detail-visit"
            :href="activeCell.url"
            target="_blank"
            rel="noopener noreferrer"
          >
            <u-icon icon="fa-solid fa-arrow-up-right-from-square" />
            {{ t('friendLinks.visitSite') }}
          </a>
        </div>
      </Transition>
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

    <!-- 申请友链弹窗 -->
    <u-dialog
      v-model="showForm"
      :title="t('friendLinks.formTitle')"
      :width="520"
      :height="620"
      modal
      :show-footer="true"
    >
      <u-form ref="formRef" :model="form" :rules="formRules" label-position="top">
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
        <u-form-item :label="t('friendLinks.formSiteName')" prop="title">
          <u-input
            v-model="form.title"
            :placeholder="t('friendLinks.formSiteNamePlaceholder')"
            prefix-icon="fa-solid fa-heading"
          />
        </u-form-item>
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
        <u-form-item :label="t('friendLinks.formDesc')" prop="description">
          <u-input
            v-model="form.description"
            :placeholder="t('friendLinks.formDescPlaceholder')"
            prefix-icon="fa-solid fa-align-left"
          />
        </u-form-item>
        <u-form-item :label="t('friendLinks.formEmail')" prop="email">
          <u-input
            v-model="form.email"
            :placeholder="t('friendLinks.formEmailPlaceholder')"
            prefix-icon="fa-solid fa-envelope"
          />
        </u-form-item>
      </u-form>
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

    <!-- 友链管理面板 -->
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
import { ref, onMounted, onUnmounted, computed, watch, reactive } from 'vue'
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
import { useHoneycombGrid } from '@/composables/useHoneycombGrid'

defineOptions({ name: 'FriendLinksView' })

const { t } = useI18n()
const { user, isLoggedIn } = storeToRefs(useUserStore())
const blogOwnerStore = useBlogOwnerStore()

function statusTagType(status: string): 'warning' | 'success' | 'danger'
{
  if (status === 'approved') return 'success'
  if (status === 'rejected') return 'danger'
  return 'warning'
}

/* ========== 公开友链列表 ========== */
const links = ref<IFriendLink[]>([])
const loading = ref(false)

async function loadLinks()
{
  loading.value = true
  try
  {
    const userId = blogOwnerStore.isSubdomainMode && blogOwnerStore.blogOwnerId
      ? blogOwnerStore.blogOwnerId
      : (user.value?.id ?? 1)
    links.value = await getFriendLinks(userId)
  }
  catch
  {
    links.value = []
  }
  finally
  {
    loading.value = false
  }
}

/* ========== 开发预览数据 ========== */
const mockLink = (id: number, title: string, url: string, desc: string, icon = ''): IFriendLink =>
  ({ id, userId: 0, title, url, icon, description: desc, status: 'approved', sortOrder: 0 }) as IFriendLink

const MOCK_LINKS: IFriendLink[] = import.meta.env.DEV ? [
  mockLink(-1, 'GitHub', 'https://github.com', '全球最大的代码托管平台，开源项目的聚集地', 'https://github.githubassets.com/favicons/favicon-dark.svg'),
  mockLink(-2, 'Vue.js', 'https://vuejs.org', '渐进式 JavaScript 框架，易学易用，性能出色', 'https://vuejs.org/logo.svg'),
  mockLink(-3, 'MDN Web Docs', 'https://developer.mozilla.org', 'Mozilla 开发者网络，前端开发权威文档参考'),
  mockLink(-4, 'Tailwind CSS', 'https://tailwindcss.com', '功能类优先的 CSS 框架，快速构建现代界面'),
  mockLink(-5, 'Stack Overflow', 'https://stackoverflow.com', '面向程序员的技术问答社区'),
  mockLink(-6, 'Vite', 'https://vitejs.dev', '下一代前端构建工具，极速热更新'),
  mockLink(-7, 'TypeScript', 'https://typescriptlang.org', 'JavaScript 的超集，带有类型系统'),
  mockLink(-8, 'Pinia', 'https://pinia.vuejs.org', 'Vue 官方状态管理库，轻量且灵活'),
  mockLink(-9, '阮一峰的博客', 'https://ruanyifeng.com', '科技爱好者周刊，前端与技术趋势分享'),
  mockLink(-10, 'Vercel', 'https://vercel.com', '前端部署平台，Next.js 背后的公司'),
  mockLink(-11, 'Figma', 'https://figma.com', '在线协作设计工具，UI 设计首选'),
] : []

const displayLinks = computed(() =>
{
  if (import.meta.env.DEV && links.value.length < 3) return [...links.value, ...MOCK_LINKS]
  return links.value
})

/* ========== 蜂窝交互系统 ========== */
const honeycombRef = ref<HTMLElement | null>(null)
const {
  hexW,
  hexH,
  cellLayout,
  gridWidth,
  gridHeight,
  hoveredId,
  focusedId,
  activeId,
  isTouch,
  hasEntered,
  getNodeState,
  onCellEnter,
  onCellLeave,
  onTipEnter,
  onTipLeave,
  onCellPress,
  onCellRelease,
  onCellFocus,
  onCellBlur,
  onCellClick,
} = useHoneycombGrid(honeycombRef, displayLinks)

/** 当前激活格子（移动端专用） */
const activeCell = computed(() =>
{
  if (activeId.value === null) return null
  return cellLayout.value.find(c => c.id === activeId.value) ?? null
})

/** 背景氛围层：在 hover 时以极淡径向渐变扩散 */
const ambientStyle = computed(() =>
{
  if (hoveredId.value === null) return { opacity: '0' }
  const cell = cellLayout.value.find(c => c.id === hoveredId.value)
  if (!cell) return { opacity: '0' }
  const cx = cell.x + hexW.value / 2
  const cy = cell.y + hexH.value / 2
  return {
    opacity: '1',
    background: `radial-gradient(ellipse 320px 280px at ${cx}px ${cy}px, hsla(var(--u-ambient-hue, ${cell.hue}), 50%, 60%, 0.06), transparent 70%)`,
  }
})

/** 点击空白区域关闭移动端详情 */
function handleClickOutside(e: Event)
{
  if (activeId.value === null) return
  const target = e.target as HTMLElement
  if (target.closest('.honeycomb__detail') || target.closest('.honeycomb__cell')) return
  activeId.value = null
}

/* ========== 申请友链表单 ========== */
const showForm = ref(false)
const submitting = ref(false)
const fetching = ref(false)
const formRef = ref<UFormExposes | null>(null)
const form = reactive({ url: '', title: '', icon: '', description: '', email: '' })

const formRules = computed<FormRules>(() => ({
  url: [{ required: true, message: t('friendLinks.formUrlPlaceholder'), trigger: 'blur' }],
  title: [{ required: true, message: t('friendLinks.formSiteNamePlaceholder'), trigger: 'blur' }],
}))

function handleUrlBlur()
{
  if (form.url && !form.title) handleAutoFetch()
}

async function handleAutoFetch()
{
  if (!form.url || fetching.value) return
  let url = form.url.trim()
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url
  form.url = url
  fetching.value = true
  try
  {
    const meta = await fetchSiteMeta(url)
    if (meta.title && !form.title) form.title = meta.title
    if (meta.icon && !form.icon) form.icon = meta.icon
    if (meta.description && !form.description) form.description = meta.description
  }
  catch
  {
    UMessageFn({ type: 'warning', message: t('friendLinks.autoFetchFailed') })
  }
  finally
  {
    fetching.value = false
  }
}

async function handleSubmit()
{
  formRef.value?.validate(async valid =>
  {
    if (!valid) return
    submitting.value = true
    try
    {
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
      formRef.value?.resetFields()
      if (isLoggedIn.value) loadLinks()
    }
    catch (err: any)
    {
      UMessageFn({ type: 'error', message: err?.message || t('friendLinks.submitFailed') })
    }
    finally
    {
      submitting.value = false
    }
  })
}

/* ========== 友链管理 ========== */
const showManage = ref(false)
const manageLoading = ref(false)
const manageList = ref<IFriendLink[]>([])

async function loadManageList()
{
  manageLoading.value = true
  try
  {
    manageList.value = await getMyFriendLinks()
  }
  catch
  {
    manageList.value = []
  }
  finally
  {
    manageLoading.value = false
  }
}

async function handleReview(id: number, action: 'approve' | 'reject')
{
  try
  {
    await reviewFriendLink(id, action)
    await loadManageList()
    await loadLinks()
  }
  catch (err: any)
  {
    UMessageFn({ type: 'error', message: err?.message || '操作失败' })
  }
}

async function handleDelete(id: number)
{
  try
  {
    await deleteFriendLink(id)
    await loadManageList()
    await loadLinks()
  }
  catch (err: any)
  {
    UMessageFn({ type: 'error', message: err?.message || '删除失败' })
  }
}

watch(showManage, val =>
{
  if (val) loadManageList()
})

onMounted(() =>
{
  loadLinks()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() =>
{
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style lang="scss" scoped>
/* ========== 动画变量（全局可调参数） ========== */
.honeycomb {
  --hex-ease: cubic-bezier(0.22, 1, 0.36, 1);
  --hex-hover-duration: 160ms;
  --hex-leave-duration: 200ms;
  --hex-press-duration: 80ms;
  --hex-scale-hover: 1.028;
  --hex-scale-press: 0.99;
  --hex-translate-hover: -4px;
  --hex-shadow-idle: 0 1px 4px rgba(0, 0, 0, 0.06);
  --hex-shadow-hover: 0 6px 20px rgba(0, 0, 0, 0.1);
  --hex-shadow-press: 0 1px 6px rgba(0, 0, 0, 0.08);
  --hex-glow-opacity: 0;
  --hex-border-opacity: 0.12;
  --hex-border-hover-opacity: 0.35;
}

.links-page {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 20px 48px;

  /* ========== Hero ========== */
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
  &__stats { flex-shrink: 0; }
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

  /* ========== 操作区 ========== */
  &__actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    margin-bottom: 32px;
  }

  /* ========== 表单 ========== */
  &__form-row { display: flex; gap: 8px; }
  &__form-icon-row { display: flex; align-items: center; gap: 8px; }

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
    &--pending  { border-left: 3px solid #e6a23c; }
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
  &__manage-item-status { flex-shrink: 0; }
  &__manage-item-actions {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  }
}

/* ==================================================================
   蜂窝布局核心
   ================================================================== */

.honeycomb {
  margin-bottom: 36px;
  min-height: 200px;
  overflow: visible;
  position: relative;

  &__loading,
  &__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 56px 0;
    color: var(--u-text-3);
    font-size: 14px;
  }

  /* 背景氛围光斑 */
  &__ambient {
    position: absolute;
    inset: -60px;
    pointer-events: none;
    z-index: 0;
    opacity: 0;
    transition: opacity 0.5s ease, background 0.4s ease;
  }

  /* 定位舞台 */
  &__stage {
    position: relative;
    margin: 0 auto;
    z-index: 1;
  }

  /* ========== 蜂窝节点 ========== */
  &__cell {
    position: absolute;
    text-decoration: none;
    color: inherit;
    z-index: 1;
    -webkit-tap-highlight-color: transparent;
    outline: none;
    /* 矩形区域不拦截鼠标 */
    pointer-events: none;

    /* 入场动画：初始隐藏 */
    opacity: 0;
    transform: translateY(12px) scale(0.97);
    transition:
      opacity 0.4s var(--hex-ease) var(--hex-enter-delay, 0ms),
      transform 0.4s var(--hex-ease) var(--hex-enter-delay, 0ms);
  }

  /* 入场完成后显示 */
  &.is-entered &__cell {
    opacity: 1;
    transform: translateY(0) scale(1);
  }

  /* 外发光层 */
  &__glow {
    position: absolute;
    inset: -4px;
    clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
    background: hsl(var(--hex-hue, 210), 50%, 60%);
    opacity: var(--hex-glow-opacity);
    filter: blur(8px);
    transition: opacity var(--hex-hover-duration) var(--hex-ease);
    pointer-events: none;
  }

  /* 半透明边框层 */
  &__border {
    position: absolute;
    inset: 0;
    clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
    background: hsl(var(--hex-hue, 210), 40%, 55%);
    opacity: var(--hex-border-opacity);
    transition: opacity var(--hex-hover-duration) var(--hex-ease);
    pointer-events: none;
  }

  /* 六边形主体 */
  &__hex {
    position: relative;
    z-index: 1;
    width: calc(100% - 2px);
    height: calc(100% - 2px);
    margin: 1px;
    clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
    background: linear-gradient(
      160deg,
      hsl(var(--hex-hue, 210), 40%, 96%) 0%,
      hsl(var(--hex-hue, 210), 35%, 91%) 100%
    );
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
    pointer-events: auto;
    transition:
      transform var(--hex-hover-duration) var(--hex-ease),
      filter var(--hex-hover-duration) var(--hex-ease);
    filter: drop-shadow(var(--hex-shadow-idle));
  }

  /* 头像 */
  &__avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: hsl(var(--hex-hue, 210), 38%, 60%);
    flex-shrink: 0;
    transition: transform var(--hex-hover-duration) var(--hex-ease);
  }

  &__letter {
    font-size: 20px;
    font-weight: 700;
    color: #fff;
    line-height: 1;
  }

  /* 站点名称 */
  &__name {
    font-size: 11px;
    font-weight: 600;
    color: var(--u-text-1);
    max-width: 80%;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.2;
    transition: color var(--hex-hover-duration) var(--hex-ease);
  }

  /* 外链弱提示 */
  &__ext-hint {
    position: absolute;
    top: 28%;
    right: 18%;
    font-size: 8px;
    color: var(--u-text-4);
    opacity: 0;
    transform: translate(2px, -2px);
    transition:
      opacity var(--hex-hover-duration) var(--hex-ease),
      transform var(--hex-hover-duration) var(--hex-ease);
    pointer-events: none;
  }

  /* 微呼吸动画 */
  &.is-entered &__hex {
    animation: hex-breathe 6s ease-in-out var(--hex-breathe-delay, 0ms) infinite;
  }

  /* ==========================================
     状态系统 (data-state)
     ========================================== */

  /* -- Hovered -- */
  &__cell[data-state="hovered"] {
    z-index: 10;
    --hex-glow-opacity: 0.22;
    --hex-border-opacity: var(--hex-border-hover-opacity);

    .honeycomb__hex {
      transform: scale(var(--hex-scale-hover)) translateY(var(--hex-translate-hover));
      filter: drop-shadow(var(--hex-shadow-hover));
      animation-play-state: paused;
    }
    .honeycomb__avatar {
      transform: translateY(-1px);
    }
    .honeycomb__name {
      color: var(--u-text-1);
    }
    .honeycomb__ext-hint {
      opacity: 0.5;
      transform: translate(0, 0);
    }
  }

  /* -- Pressed -- */
  &__cell[data-state="pressed"] {
    z-index: 10;
    --hex-glow-opacity: 0.15;
    --hex-border-opacity: var(--hex-border-hover-opacity);

    .honeycomb__hex {
      transform: scale(var(--hex-scale-press)) translateY(1px);
      filter: drop-shadow(var(--hex-shadow-press));
      transition-duration: var(--hex-press-duration);
      animation-play-state: paused;
    }
  }

  /* -- Focus visible (键盘) -- */
  &__cell[data-state="focus-visible"] {
    z-index: 10;
    --hex-glow-opacity: 0.18;
    --hex-border-opacity: 0.5;

    .honeycomb__hex {
      transform: scale(var(--hex-scale-hover)) translateY(var(--hex-translate-hover));
      filter: drop-shadow(var(--hex-shadow-hover));
      animation-play-state: paused;
    }
    /* 高对比度 focus ring：两层描边确保可见性 */
    .honeycomb__border {
      opacity: 0.6;
      background: var(--u-primary);
    }
    .honeycomb__name {
      color: var(--u-primary);
    }
  }

  /* -- Near (邻近联动) -- */
  &__cell[data-state="near"] {
    z-index: 2;
    --hex-border-opacity: 0.2;

    .honeycomb__hex {
      transform: scale(1.008);
      transition-duration: var(--hex-hover-duration);
      transition-delay: 30ms;
    }
  }

  /* -- Dimmed (非关联退让) -- */
  &__cell[data-state="dimmed"] {
    .honeycomb__hex {
      opacity: 0.72;
      transition-duration: var(--hex-leave-duration);
    }
    .honeycomb__name {
      opacity: 0.7;
    }
  }

  /* ========== 桌面端悬浮提示 ========== */
  &__tip {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-top: -4px;
    width: 230px;
    padding: 12px 14px;
    background: var(--u-background-1);
    border: 1px solid var(--u-border-1);
    border-radius: 12px;
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.1);
    z-index: 100;
    pointer-events: auto;
    cursor: default;
  }
  &__tip-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--u-text-1);
    display: block;
    margin-bottom: 4px;
  }
  &__tip-desc {
    font-size: 12px;
    color: var(--u-text-3);
    margin: 0 0 6px;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  &__tip-url {
    font-size: 11px;
    color: var(--u-primary);
    word-break: break-all;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  /* 移动端详情（默认隐藏） */
  &__detail { display: none; }
}

/* ========== 暗色主题 ========== */
:root.dark {
  .honeycomb {
    --hex-shadow-idle: 0 1px 4px rgba(0, 0, 0, 0.2);
    --hex-shadow-hover: 0 6px 20px rgba(0, 0, 0, 0.3);
    --hex-shadow-press: 0 1px 6px rgba(0, 0, 0, 0.25);
    --hex-border-opacity: 0.18;
    --hex-border-hover-opacity: 0.45;
  }

  .honeycomb__hex {
    background: linear-gradient(
      160deg,
      hsl(var(--hex-hue, 210), 22%, 22%) 0%,
      hsl(var(--hex-hue, 210), 18%, 16%) 100%
    );
  }
  .honeycomb__avatar {
    background: hsl(var(--hex-hue, 210), 28%, 35%);
  }
  .honeycomb__glow {
    background: hsl(var(--hex-hue, 210), 35%, 42%);
  }
  .honeycomb__border {
    background: hsl(var(--hex-hue, 210), 30%, 48%);
  }
  .honeycomb__tip {
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.4);
  }
  .honeycomb__ambient {
    /* 暗色下氛围光斑更柔和 */
  }
}

/* ========== 微呼吸动画 ========== */
@keyframes hex-breathe {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.965; }
}

/* ========== 桌面端提示过渡 ========== */
.hex-tip-enter-active,
.hex-tip-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.hex-tip-enter-from,
.hex-tip-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(6px);
}

/* ========== 移动端详情过渡 ========== */
.hex-detail-enter-active,
.hex-detail-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.hex-detail-enter-from,
.hex-detail-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

/* ========== prefers-reduced-motion ========== */
@media (prefers-reduced-motion: reduce) {
  .honeycomb {
    --hex-hover-duration: 0ms;
    --hex-leave-duration: 0ms;
    --hex-press-duration: 0ms;
  }

  .honeycomb__cell {
    transition-duration: 0ms !important;
  }

  .honeycomb.is-entered .honeycomb__hex {
    animation: none;
  }

  .honeycomb__ambient {
    display: none;
  }

  /* 保留最基本的视觉反馈：透明度与边框 */
  .honeycomb__cell[data-state="hovered"] .honeycomb__hex,
  .honeycomb__cell[data-state="focus-visible"] .honeycomb__hex {
    transform: none;
    filter: drop-shadow(var(--hex-shadow-hover));
  }
  .honeycomb__cell[data-state="hovered"] .honeycomb__border,
  .honeycomb__cell[data-state="focus-visible"] .honeycomb__border {
    opacity: 0.4;
  }
  .honeycomb__cell[data-state="dimmed"] .honeycomb__hex {
    opacity: 0.8;
  }
}

/* ========== 响应式 ========== */
@media (max-width: 640px) {
  .links-page {
    padding: 0 12px 32px;

    &__hero {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
    &__manage-item-inner { flex-wrap: wrap; }
    &__manage-item-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }

  /* 移动端降级 */
  .honeycomb {
    /* 关闭邻近联动 & 背景氛围 */
    .honeycomb__ambient { display: none; }

    &__cell[data-state="near"] .honeycomb__hex {
      transform: none;
    }
    &__cell[data-state="dimmed"] .honeycomb__hex {
      opacity: 1;
    }
    &__cell[data-state="dimmed"] .honeycomb__name {
      opacity: 1;
    }

    /* 关闭微呼吸 */
    &.is-entered .honeycomb__hex {
      animation: none;
    }
  }

  /* 隐藏桌面 tip，启用详情面板 */
  .honeycomb__tip { display: none !important; }
  .honeycomb__ext-hint { display: none; }

  .honeycomb__detail {
    display: flex !important;
    flex-direction: column;
    gap: 12px;
    padding: 16px 16px 14px;
    background: var(--u-background-2);
    border-top: 1px solid var(--u-border-1);
    border-radius: 16px 16px 0 0;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
    position: fixed;
    left: 0;
    right: 0;
    bottom: calc(56px + env(safe-area-inset-bottom, 0px));
    z-index: 999;
  }

  .honeycomb__detail-close {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: var(--u-background-3);
    border-radius: 50%;
    color: var(--u-text-3);
    cursor: pointer;
    font-size: 12px;
    -webkit-tap-highlight-color: transparent;
    &:active { opacity: 0.6; }
  }

  .honeycomb__detail-header {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .honeycomb__detail-avatar {
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: hsl(var(--hex-hue, 210), 45%, 55%);
  }

  .honeycomb__detail-info {
    flex: 1;
    min-width: 0;

    strong {
      display: block;
      font-size: 15px;
      font-weight: 600;
      color: var(--u-text-1);
      margin-bottom: 2px;
    }
    p {
      font-size: 12px;
      color: var(--u-text-3);
      margin: 0;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }

  .honeycomb__detail-visit {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 0;
    background: var(--u-primary);
    color: #fff;
    border-radius: 10px;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    -webkit-tap-highlight-color: transparent;
    &:active { opacity: 0.8; }
  }
}
</style>
