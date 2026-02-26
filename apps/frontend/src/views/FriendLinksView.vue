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

    <!-- 蜂窝布局友链列表 -->
    <section ref="honeycombRef" class="honeycomb" @click.self="activeId = -1">
      <div v-if="loading" class="honeycomb__loading">
        <u-icon icon="fa-solid fa-spinner" spin />
      </div>
      <template v-else-if="displayLinks.length > 0">
        <div
          class="honeycomb__stage"
          :style="{ width: gridTotalWidth + 'px', height: gridHeight + 'px' }"
        >
          <a
            v-for="(cell, index) in cellLayout"
            :key="cell.id"
            :href="cell.url"
            target="_blank"
            rel="noopener noreferrer"
            class="honeycomb__cell"
            :class="{ 'is-active': activeId === cell.id }"
            :style="{
              left: cell.x + 'px',
              top: cell.y + 'px',
              width: hexW + 'px',
              height: hexH + 'px',
              animationDelay: index * 50 + 'ms',
              '--hex-hue': cell.hue,
            }"
            @mouseenter="handleCellEnter(cell.id)"
            @mouseleave="handleCellLeave"
            @click.prevent="handleCellClick($event, cell)"
          >
            <!-- 六边形外发光层 -->
            <div class="honeycomb__glow" />
            <div class="honeycomb__hex">
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
            </div>
            <!-- 桌面端悬浮提示 -->
            <Transition name="hex-tip">
              <div v-show="hoveredId === cell.id" class="honeycomb__tip">
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

      <!-- 移动端：点击展开的详情浮层 -->
      <Transition name="hex-detail">
        <div v-if="activeCell" class="honeycomb__detail" @click.stop>
          <button class="honeycomb__detail-close" @click="activeId = -1">
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
import { ref, onMounted, onUnmounted, computed, watch, reactive, nextTick } from 'vue'
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

/* ---------- 蜂窝布局计算 ---------- */
const honeycombRef = ref<HTMLElement | null>(null)
const hoveredId = ref<number>(-1)
const activeId = ref<number>(-1)
const containerWidth = ref(900)
let resizeObserver: ResizeObserver | null = null

/** 检测触控设备 */
const isTouch = ref(false)

/** 开发预览：注入模拟数据以测试蜂窝多格效果 */
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

/** 展示用的友链列表（真实数据 + 开发预览数据） */
const displayLinks = computed(() => {
  if (import.meta.env.DEV && links.value.length < 3) {
    return [...links.value, ...MOCK_LINKS]
  }
  return links.value
})

/** 六边形尺寸（根据容器宽度响应式调整） */
const hexW = computed(() => containerWidth.value <= 480 ? 90 : containerWidth.value <= 700 ? 110 : 130)
const hexH = computed(() => Math.round(hexW.value * 1.1547))
const hexGap = computed(() => containerWidth.value <= 480 ? 4 : 6)

/** 色相调色板 */
const HEX_HUES = [215, 260, 330, 165, 25, 290, 140, 50, 195, 310, 180, 350]

/** 蜂窝网格布局坐标计算 */
const cellLayout = computed(() => {
  const W = hexW.value, H = hexH.value, G = hexGap.value
  const maxCols = Math.max(2, Math.floor((containerWidth.value + G) / (W + G)))
  const rowH = H * 0.75 + G
  let row = 0, col = 0
  const colsInRow = (r: number) => r % 2 === 0 ? maxCols : Math.max(1, maxCols - 1)
  return displayLinks.value.map((link, i) => {
    if (col >= colsInRow(row)) { row++; col = 0 }
    const odd = row % 2 === 1
    const x = col * (W + G) + (odd ? (W + G) / 2 : 0)
    const y = row * rowH
    col++
    return { ...link, x, y, hue: HEX_HUES[i % HEX_HUES.length] }
  })
})

/** 当前被激活（移动端点击选中）的格子数据 */
const activeCell = computed(() => {
  if (activeId.value === -1) return null
  return cellLayout.value.find(c => c.id === activeId.value) ?? null
})

const gridTotalWidth = computed(() => {
  if (cellLayout.value.length === 0) return 0
  return Math.max(...cellLayout.value.map(c => c.x)) + hexW.value
})

const gridHeight = computed(() => {
  if (cellLayout.value.length === 0) return 0
  return Math.max(...cellLayout.value.map(c => c.y)) + hexH.value
})

/** 桌面端 hover 进入 */
function handleCellEnter(id: number) {
  if (!isTouch.value) hoveredId.value = id
}
/** 桌面端 hover 离开 */
function handleCellLeave() {
  if (!isTouch.value) hoveredId.value = -1
}

/** 统一 click 处理：桌面端直接跳转，移动端先展开详情 */
function handleCellClick(e: MouseEvent | TouchEvent, cell: { id: number; url: string }) {
  if (isTouch.value) {
    // 移动端：首次点击展示详情，已激活状态再点击跳转
    if (activeId.value === cell.id) {
      window.open(cell.url, '_blank', 'noopener,noreferrer')
    } else {
      activeId.value = cell.id
    }
  } else {
    // 桌面端：直接跳转
    window.open(cell.url, '_blank', 'noopener,noreferrer')
  }
}

/** 点击空白区域关闭移动端详情 */
function handleClickOutside(e: Event) {
  if (activeId.value === -1) return
  const detail = document.querySelector('.honeycomb__detail')
  const target = e.target as HTMLElement
  if (detail && detail.contains(target)) return
  if (target.closest('.honeycomb__cell')) return
  activeId.value = -1
}

onMounted(() => {
  loadLinks()
  // 检测触控设备
  isTouch.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  document.addEventListener('click', handleClickOutside)
  nextTick(() => {
    if (honeycombRef.value) {
      containerWidth.value = honeycombRef.value.clientWidth
      resizeObserver = new ResizeObserver((entries) => {
        containerWidth.value = entries[0].contentRect.width
      })
      resizeObserver.observe(honeycombRef.value)
    }
  })
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  document.removeEventListener('click', handleClickOutside)
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

/* ========== 蜂窝布局 ========== */
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

  /* 定位舞台 */
  &__stage {
    position: relative;
    margin: 0 auto;
  }

  /* 单个蜂窝格子 */
  &__cell {
    position: absolute;
    text-decoration: none;
    color: inherit;
    animation: hex-pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    z-index: 1;
    -webkit-tap-highlight-color: transparent;

    &:hover,
    &.is-active {
      z-index: 10;
      .honeycomb__hex { transform: scale(1.1); }
      .honeycomb__glow { opacity: 1; }
    }
  }

  /* 外发光层（clip-path 裁剪成略大的六边形） */
  &__glow {
    position: absolute;
    inset: -3px;
    clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
    background: hsl(var(--hex-hue, 210), 60%, 65%);
    opacity: 0;
    filter: blur(6px);
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  /* 六边形主体 */
  &__hex {
    width: 100%;
    height: 100%;
    clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
    background: linear-gradient(
      160deg,
      hsl(var(--hex-hue, 210), 55%, 92%) 0%,
      hsl(var(--hex-hue, 210), 50%, 85%) 100%
    );
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    cursor: pointer;
    position: relative;
    z-index: 1;
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
    background: hsl(var(--hex-hue, 210), 45%, 55%);
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
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
  }

  /* 桌面端悬浮提示卡片 */
  &__tip {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-top: -6px;
    width: 230px;
    padding: 12px 14px;
    background: var(--u-background-1);
    border: 1px solid var(--u-border-1);
    border-radius: 12px;
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.12);
    z-index: 100;
    pointer-events: none;
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

  /* 移动端详情悬浮面板 */
  &__detail {
    display: none;
  }
}

/* ====== 暗色主题 ====== */
:root.dark {
  .honeycomb__hex {
    background: linear-gradient(
      160deg,
      hsl(var(--hex-hue, 210), 28%, 24%) 0%,
      hsl(var(--hex-hue, 210), 25%, 18%) 100%
    );
  }
  .honeycomb__avatar {
    background: hsl(var(--hex-hue, 210), 32%, 38%);
  }
  .honeycomb__glow {
    background: hsl(var(--hex-hue, 210), 40%, 45%);
  }
  .honeycomb__tip {
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.4);
  }
}

/* ====== 动画 ====== */
@keyframes hex-pop-in {
  from { opacity: 0; transform: scale(0.6) rotate(-8deg); }
  to { opacity: 1; transform: scale(1) rotate(0deg); }
}

/* 桌面端提示过渡 */
.hex-tip-enter-active,
.hex-tip-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.hex-tip-enter-from,
.hex-tip-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(6px);
}

/* 移动端详情面板过渡 */
.hex-detail-enter-active,
.hex-detail-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.hex-detail-enter-from,
.hex-detail-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

/* ====== 响应式 ====== */
@media (max-width: 640px) {
  .links-page {
    padding: 0 12px 32px;

    &__hero {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
    &__manage-item-inner {
      flex-wrap: wrap;
    }
    &__manage-item-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }

  /* 移动端：隐藏桌面端提示，启用详情面板 */
  .honeycomb__tip {
    display: none !important;
  }

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
