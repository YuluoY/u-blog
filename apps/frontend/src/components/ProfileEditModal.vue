<template>
  <u-dialog
    v-model="visible"
    :title="t('profile.myProfile')"
    :width="600"
    :height="0.8"
    :modal="true"
    :close-on-click-modal="true"
    :show-footer="true"
    :z-index="2100"
    modal-class="profile-dialog-overlay"
  >
    <div class="profile-edit">
      <!-- 头像 -->
      <div class="profile-edit__avatar-section">
        <div class="profile-edit__avatar-wrap" @click="triggerAvatarUpload">
          <img
            v-if="form.avatar"
            class="profile-edit__avatar-img"
            :src="form.avatar"
            alt="avatar"
          />
          <u-icon v-else class="profile-edit__avatar-placeholder" icon="fa-solid fa-circle-user" />
          <div class="profile-edit__avatar-overlay">
            <u-icon icon="fa-solid fa-camera" />
          </div>
        </div>
        <input
          ref="avatarInputRef"
          type="file"
          accept=".png,.jpg,.jpeg,.gif,.webp,.svg"
          class="profile-edit__avatar-input"
          @change="handleAvatarChange"
        />
        <span class="profile-edit__avatar-hint">{{ t('profile.avatarUpload') }}</span>
      </div>

      <!-- 表单字段：双列栅格 -->
      <div class="profile-edit__form">
        <!-- 第一行：昵称 + 性别 -->
        <div class="profile-edit__row">
          <div class="profile-edit__field profile-edit__field--half">
            <label class="profile-edit__label">{{ t('profile.nickname') }}</label>
            <u-input
              v-model="form.namec"
              :placeholder="t('profile.nicknamePlaceholder')"
              :max-length="100"
              clearable
            />
          </div>
          <div class="profile-edit__field profile-edit__field--half">
            <label class="profile-edit__label">{{ t('profile.gender') }}</label>
            <u-select
              v-model="form.gender"
              :options="genderOptions"
              :placeholder="t('profile.genderUnset')"
            />
          </div>
        </div>

        <!-- 第二行：生日（年月日三级下拉） -->
        <div class="profile-edit__field">
          <label class="profile-edit__label">{{ t('profile.birthday') }}</label>
          <div class="profile-edit__birthday-selects">
            <u-select
              v-model="form.birthdayYear"
              :options="yearOptions"
              :placeholder="t('profile.birthdayYear')"
              clearable
            />
            <u-select
              v-model="form.birthdayMonth"
              :options="monthOptions"
              :placeholder="t('profile.birthdayMonth')"
              clearable
            />
            <u-select
              v-model="form.birthdayDay"
              :options="dayOptions"
              :placeholder="t('profile.birthdayDay')"
              clearable
            />
          </div>
        </div>

        <!-- 所在地（省市区级联 + 详细地址） -->
        <div class="profile-edit__field">
          <label class="profile-edit__label">{{ t('profile.location') }}</label>
          <div class="profile-edit__location">
            <u-cascader
              v-model="form.locationCodes"
              :options="regionOptions"
              :placeholder="regionLoading ? t('profile.locationLoading') : t('profile.locationRegionPlaceholder')"
              :disabled="regionLoading"
              clearable
              change-on-select
            />
            <u-input
              v-model="form.locationDetail"
              :placeholder="t('profile.locationDetailPlaceholder')"
              :max-length="255"
              clearable
            />
          </div>
        </div>

        <!-- 个人简介（全宽） -->
        <div class="profile-edit__field">
          <label class="profile-edit__label">
            {{ t('profile.bio') }}
            <button
              class="profile-edit__ai-btn"
              :disabled="aiGenerating"
              @click="handleAiBio"
            >
              <u-icon v-if="aiGenerating" icon="fa-solid fa-spinner" spin />
              <u-icon v-else icon="fa-solid fa-wand-magic-sparkles" />
              {{ aiGenerating ? t('ai.generating') : t('ai.generate') }}
            </button>
          </label>
          <u-input
            v-model="form.bio"
            type="textarea"
            :placeholder="t('profile.bioPlaceholder')"
            :max-length="255"
            :rows="3"
            show-word-limit
          />
        </div>

        <!-- 个人网站（卡片式布局） -->
        <div class="profile-edit__field">
          <label class="profile-edit__label">{{ t('profile.website') }}</label>
          <div class="profile-edit__website-card">
            <div class="profile-edit__website-main">
              <div class="profile-edit__website-icon">
                <u-icon :icon="websiteIcon" />
              </div>
              <div class="profile-edit__website-fields">
                <u-input
                  v-model="form.websiteUrl"
                  :placeholder="t('profile.websiteUrlPlaceholder')"
                  clearable
                  @input="onWebsiteUrlChange"
                />
                <div class="profile-edit__website-meta">
                  <u-input
                    v-model="form.websiteTitle"
                    :placeholder="t('profile.websiteTitlePlaceholder')"
                    clearable
                  />
                  <u-input
                    v-model="form.websiteDesc"
                    :placeholder="t('profile.websiteDescPlaceholder')"
                    clearable
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 社交链接（单行列表式，URL 自动识别平台 + favicon） -->
        <div class="profile-edit__field">
          <label class="profile-edit__label">{{ t('profile.socials') }}</label>
          <div class="profile-edit__socials">
            <div
              v-for="(social, idx) in form.socials"
              :key="idx"
              class="profile-edit__social-item"
            >
              <!-- 左：平台图标（favicon 优先，降级 FA 图标） -->
              <div class="profile-edit__social-icon-wrap">
                <img
                  v-if="social.favicon"
                  :src="social.favicon"
                  class="profile-edit__social-favicon"
                  @error="social.favicon = ''"
                />
                <u-icon
                  v-else
                  :icon="social.icon || 'fa-solid fa-link'"
                  class="profile-edit__social-fa-icon"
                />
              </div>
              <!-- 中：平台名标签 + URL 输入 -->
              <div class="profile-edit__social-body">
                <span
                  v-if="social.name"
                  class="profile-edit__social-badge"
                >
                  {{ social.name }}
                </span>
                <u-input
                  v-model="social.url"
                  :placeholder="t('profile.socialUrlPlaceholder')"
                  clearable
                  @change="onSocialUrlChange(idx)"
                />
              </div>
              <!-- 右：删除 -->
              <u-button
                size="small"
                class="profile-edit__social-remove"
                @click="removeSocial(idx)"
              >
                <u-icon icon="fa-solid fa-xmark" />
              </u-button>
            </div>
            <u-button size="small" @click="addSocial">
              <u-icon icon="fa-solid fa-plus" />
              {{ t('profile.addSocial') }}
            </u-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 使用 dialog 原生 footer slot，始终固定在底部 -->
    <template #footer>
      <div class="profile-edit__footer">
        <u-button @click="visible = false">{{ t('profile.cancel') }}</u-button>
        <u-button type="primary" :disabled="saving" @click="handleSave">
          {{ saving ? t('profile.saving') : t('profile.save') }}
        </u-button>
      </div>
    </template>
  </u-dialog>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { CGender } from '@u-blog/model'
import { useUserStore } from '@/stores/model/user'
import { uploadFile } from '@/api/request'
import { loadChinaRegions, getLabelsFromCodes } from '@/data/china-regions'
import type { RegionOption } from '@/data/china-regions'
import { useAiGenerate } from '@/composables/useAiGenerate'
import { fetchSiteMeta } from '@/api/friendLink'

defineOptions({ name: 'ProfileEditModal' })

const { t, locale } = useI18n({ useScope: 'global' })
const userStore = useUserStore()

const visible = defineModel<boolean>('visible', { default: false })

const avatarInputRef = ref<HTMLInputElement | null>(null)
const saving = ref(false)

/* ---------- AI 个人简介生成 ---------- */
const { generating: aiGenerating, generate: aiGenerate } = useAiGenerate()

/** 收集用户信息用于 AI 生成简介 */
function buildBioContext(): string
{
  const parts: string[] = []
  if (form.namec) parts.push(`昵称: ${form.namec}`)
  if (form.gender && form.gender !== CGender.UNSET)
  {
    const genderMap: Record<string, string> = {
      [CGender.MALE]: '男', [CGender.FEMALE]: '女', [CGender.OTHER]: '其他',
    }
    parts.push(`性别: ${genderMap[form.gender] || ''}`)
  }
  if (form.bio) parts.push(`现有简介: ${form.bio}`)
  if (form.websiteUrl) parts.push(`个人网站: ${form.websiteUrl}`)
  return parts.length > 0 ? parts.join('\n') : '一位博客用户'
}

/** 点击「AI 生成」按钮 */
async function handleAiBio()
{
  const context = buildBioContext()
  const result = await aiGenerate('bio', context)
  if (result)
  
    form.bio = result.slice(0, 255) // 尊重最大长度限制
  
}

/** 地区数据（懒加载） */
const regionOptions = ref<RegionOption[]>([])
const regionLoading = ref(false)

/** 性别选项 */
const genderOptions = computed(() => [
  { value: CGender.UNSET, label: t('profile.genderUnset') },
  { value: CGender.MALE, label: t('profile.genderMale') },
  { value: CGender.FEMALE, label: t('profile.genderFemale') },
  { value: CGender.OTHER, label: t('profile.genderOther') },
])

/** 年份选项（当前年至 1920 年降序） */
const yearOptions = computed(() =>
{
  const current = new Date().getFullYear()
  return Array.from({ length: current - 1919 }, (_, i) => ({
    value: current - i,
    label: String(current - i),
  }))
})

/** 月份选项（本地化月份名称） */
const monthOptions = computed(() =>
{
  const formatter = new Intl.DateTimeFormat(locale.value, { month: 'long' })
  return Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: formatter.format(new Date(2000, i, 1)),
  }))
})

/** 表单数据 */
const form = reactive({
  namec: '',
  avatar: '',
  bio: '',
  gender: CGender.UNSET as string,
  birthdayYear: '' as string | number,
  birthdayMonth: '' as string | number,
  birthdayDay: '' as string | number,
  locationCodes: [] as (string | number)[],
  locationDetail: '',
  websiteUrl: '',
  websiteTitle: '',
  websiteDesc: '',
  socials: [] as Array<{ name: string; icon: string; url: string; favicon: string }>,
})

/** 日期选项（根据当前年月动态计算天数） */
const dayOptions = computed(() =>
{
  const year = Number(form.birthdayYear) || 2000
  const month = Number(form.birthdayMonth) || 1
  const daysInMonth = new Date(year, month, 0).getDate()
  return Array.from({ length: daysInMonth }, (_, i) => ({
    value: i + 1,
    label: String(i + 1),
  }))
})

/** 年月变更时，限制日期不超过当月最大天数 */
watch(
  () => [form.birthdayYear, form.birthdayMonth],
  () =>
  {
    if (!form.birthdayDay || !form.birthdayMonth) return
    const year = Number(form.birthdayYear) || 2000
    const month = Number(form.birthdayMonth)
    const maxDay = new Date(year, month, 0).getDate()
    if (Number(form.birthdayDay) > maxDay)
    
      form.birthdayDay = maxDay
    
  },
)

/** 对话框打开时同步用户数据到表单 + 懒加载地区数据 */
watch(visible, async val =>
{
  if (val)
  {
    syncFormFromUser()
    // 首次打开时加载中国省市区数据
    if (regionOptions.value.length === 0)
    {
      regionLoading.value = true
      try
      {
        regionOptions.value = await loadChinaRegions()
      }
      catch (err)
      {
        console.error('Failed to load region data:', err)
      }
      finally
      {
        regionLoading.value = false
      }
    }
  }
})

function syncFormFromUser()
{
  const u = userStore.user
  form.namec = u?.namec || ''
  form.avatar = u?.avatar || ''
  form.bio = u?.bio || ''
  form.gender = (u?.gender as string) || CGender.UNSET
  // 解析生日为年/月/日
  if (u?.birthday)
  {
    const d = new Date(u.birthday)
    if (!isNaN(d.getTime()))
    {
      form.birthdayYear = d.getFullYear()
      form.birthdayMonth = d.getMonth() + 1
      form.birthdayDay = d.getDate()
    }
  }
  else
  {
    form.birthdayYear = ''
    form.birthdayMonth = ''
    form.birthdayDay = ''
  }
  // 解析 location JSON（新格式）或纯文本（旧格式）
  parseLocation(u?.location || '')
  // 拆分网站字段
  const w = u?.website as any
  form.websiteUrl = w?.url || ''
  form.websiteTitle = w?.title || ''
  form.websiteDesc = w?.desc || ''
  // 社交链接深拷贝
  form.socials = Array.isArray(u?.socials)
    ? u.socials.map((s: any) => ({
      name: s.name || '',
      icon: s.icon || '',
      url: s.url || '',
      favicon: s.url ? getSocialFaviconUrl(s.url) : '',
    }))
    : []
}

/**
 * 解析 location 字段（兼容新旧格式）
 * 新格式 JSON: { codes: [...], detail: "..." }
 * 旧格式：纯文本字符串
 */
function parseLocation(raw: string)
{
  if (!raw)
  {
    form.locationCodes = []
    form.locationDetail = ''
    return
  }
  try
  {
    const parsed = JSON.parse(raw)
    if (parsed && Array.isArray(parsed.codes))
    {
      form.locationCodes = parsed.codes
      form.locationDetail = parsed.detail || ''
      return
    }
  }
  catch
  {
    // 非 JSON，视为旧格式纯文本
  }
  // 旧格式：放入详细地址
  form.locationCodes = []
  form.locationDetail = raw
}

/**
 * 将选中的地区编码 + 详细地址序列化为 JSON 字符串
 */
function serializeLocation(): string | null
{
  if (form.locationCodes.length === 0 && !form.locationDetail) return null
  const labels = getLabelsFromCodes(form.locationCodes, regionOptions.value)
  return JSON.stringify({
    codes: form.locationCodes,
    labels,
    detail: form.locationDetail || '',
  })
}

/** 触发隐藏的文件选择器 */
function triggerAvatarUpload()
{
  avatarInputRef.value?.click()
}

/** 头像文件选择后上传 */
async function handleAvatarChange(e: Event)
{
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  try
  {
    const result = await uploadFile(file)
    form.avatar = result.url
  }
  catch (err: any)
  {
    console.error('Avatar upload failed:', err)
  }
  // 重置 input 以支持再次选择同一文件
  if (avatarInputRef.value) avatarInputRef.value.value = ''
}

/** 社交平台自动识别映射表 */
const SOCIAL_PLATFORMS: Record<string, { name: string; icon: string }> = {
  'github.com': { name: 'GitHub', icon: 'fa-brands fa-github' },
  'twitter.com': { name: 'X (Twitter)', icon: 'fa-brands fa-x-twitter' },
  'x.com': { name: 'X (Twitter)', icon: 'fa-brands fa-x-twitter' },
  'linkedin.com': { name: 'LinkedIn', icon: 'fa-brands fa-linkedin' },
  'facebook.com': { name: 'Facebook', icon: 'fa-brands fa-facebook' },
  'instagram.com': { name: 'Instagram', icon: 'fa-brands fa-instagram' },
  'youtube.com': { name: 'YouTube', icon: 'fa-brands fa-youtube' },
  'weibo.com': { name: '微博', icon: 'fa-brands fa-weibo' },
  'weibo.cn': { name: '微博', icon: 'fa-brands fa-weibo' },
  't.me': { name: 'Telegram', icon: 'fa-brands fa-telegram' },
  'telegram.org': { name: 'Telegram', icon: 'fa-brands fa-telegram' },
  'discord.com': { name: 'Discord', icon: 'fa-brands fa-discord' },
  'discord.gg': { name: 'Discord', icon: 'fa-brands fa-discord' },
  'bilibili.com': { name: 'Bilibili', icon: 'fa-brands fa-bilibili' },
  'zhihu.com': { name: '知乎', icon: 'fa-solid fa-z' },
  'douyin.com': { name: '抖音', icon: 'fa-brands fa-tiktok' },
  'tiktok.com': { name: 'TikTok', icon: 'fa-brands fa-tiktok' },
  'reddit.com': { name: 'Reddit', icon: 'fa-brands fa-reddit' },
  'stackoverflow.com': { name: 'Stack Overflow', icon: 'fa-brands fa-stack-overflow' },
  'medium.com': { name: 'Medium', icon: 'fa-brands fa-medium' },
  'dev.to': { name: 'Dev.to', icon: 'fa-brands fa-dev' },
  'codepen.io': { name: 'CodePen', icon: 'fa-brands fa-codepen' },
  'dribbble.com': { name: 'Dribbble', icon: 'fa-brands fa-dribbble' },
  'behance.net': { name: 'Behance', icon: 'fa-brands fa-behance' },
  'figma.com': { name: 'Figma', icon: 'fa-brands fa-figma' },
  'spotify.com': { name: 'Spotify', icon: 'fa-brands fa-spotify' },
  'twitch.tv': { name: 'Twitch', icon: 'fa-brands fa-twitch' },
  'pinterest.com': { name: 'Pinterest', icon: 'fa-brands fa-pinterest' },
  'mastodon.social': { name: 'Mastodon', icon: 'fa-brands fa-mastodon' },
  'threads.net': { name: 'Threads', icon: 'fa-brands fa-threads' },
  'juejin.cn': { name: '掘金', icon: 'fa-solid fa-fire' },
  'gitee.com': { name: 'Gitee', icon: 'fa-solid fa-code-branch' },
  'npmjs.com': { name: 'npm', icon: 'fa-brands fa-npm' },
}

/** 从 URL 检测社交平台（精确匹配 + 后缀匹配子域名） */
function detectPlatform(url: string): { name: string; icon: string } | null
{
  try
  {
    const hostname = new URL(url).hostname.replace(/^www\./, '')
    if (SOCIAL_PLATFORMS[hostname]) return SOCIAL_PLATFORMS[hostname]
    for (const [domain, platform] of Object.entries(SOCIAL_PLATFORMS))
    {
      if (hostname.endsWith(`.${domain}`) || hostname === domain)
      
        return platform
      
    }
  }
  catch
  {
    // URL 无效，忽略
  }
  return null
}

/** 社交链接 URL 变更时自动识别平台并设置 favicon */
async function onSocialUrlChange(idx: number)
{
  const social = form.socials[idx]
  if (!social.url)
  {
    social.name = ''
    social.icon = ''
    social.favicon = ''
    return
  }
  // 补全协议
  if (!/^https?:\/\//i.test(social.url))
  
    social.url = 'https://' + social.url
  
  const platform = detectPlatform(social.url)
  if (platform)
  {
    // 已知平台：使用本地映射
    social.name = platform.name
    social.icon = platform.icon
    social.favicon = getSocialFaviconUrl(social.url)
  }
  else
  {
    // 未知平台：调用后端接口抓取真实站点 meta
    social.favicon = getSocialFaviconUrl(social.url) // 先用默认 favicon 占位
    try
    {
      const meta = await fetchSiteMeta(social.url)
      // 确保未被用户改掉（防止异步竞态）
      if (form.socials[idx]?.url === social.url)
      {
        if (meta.title && !social.name) social.name = meta.title
        if (meta.icon) social.favicon = meta.icon
      }
    }
    catch
    {
      // 接口失败则保留域名推断
      const domain = getDomain(social.url)
      if (domain && !social.name)
      {
        const siteName = domain.split('.')[0]
        social.name = siteName.charAt(0).toUpperCase() + siteName.slice(1)
      }
    }
  }
}

/** 从 URL 提取主域名 */
function getDomain(url: string): string
{
  try
  {
    return new URL(url).hostname.replace(/^www\./, '')
  }
  catch
  {
    return ''
  }
}

/**
 * 获取社交平台 favicon URL
 * 直接请求网站自身的 /favicon.ico（避免依赖被墙的 Google Favicon Service）
 */
function getSocialFaviconUrl(url: string): string
{
  try
  {
    const { protocol, hostname } = new URL(url)
    if (!hostname) return ''
    return `${protocol}//${hostname}/favicon.ico`
  }
  catch
  {
    return ''
  }
}

/** 网站图标（基于 URL 自动检测，无匹配则显示地球图标） */
const websiteIcon = computed(() =>
{
  if (!form.websiteUrl) return 'fa-solid fa-globe'
  const platform = detectPlatform(form.websiteUrl)
  return platform?.icon || 'fa-solid fa-globe'
})

/** 网站 URL 变更时自动填充标题和描述 */
async function onWebsiteUrlChange()
{
  if (!form.websiteUrl) return
  // 补全协议
  if (!/^https?:\/\//i.test(form.websiteUrl))
  
    form.websiteUrl = 'https://' + form.websiteUrl
  
  const platform = detectPlatform(form.websiteUrl)
  if (platform)
  {
    if (!form.websiteTitle) form.websiteTitle = platform.name
  }
  else
  {
    // 调用后端抓取真实站点 meta
    try
    {
      const meta = await fetchSiteMeta(form.websiteUrl)
      if (meta.title && !form.websiteTitle) form.websiteTitle = meta.title
      if (meta.description && !form.websiteDesc) form.websiteDesc = meta.description
    }
    catch
    {
      // 降级：从域名提取
      try
      {
        const hostname = new URL(form.websiteUrl).hostname.replace(/^www\./, '')
        if (!form.websiteTitle) form.websiteTitle = hostname
      }
      catch
      { /* URL 无效 */ }
    }
  }
}

/** 添加一条社交链接 */
function addSocial()
{
  form.socials.push({ name: '', icon: '', url: '', favicon: '' })
}

/** 移除社交链接 */
function removeSocial(idx: number)
{
  form.socials.splice(idx, 1)
}

/** 保存个人资料 */
async function handleSave()
{
  saving.value = true
  try
  {
    // 组装 website 对象（至少有 url 才保存）
    const website = form.websiteUrl
      ? { url: form.websiteUrl, title: form.websiteTitle, desc: form.websiteDesc, avatar: '' }
      : null

    // 过滤掉空社交链接，并剥离 favicon（仅前端渲染用，不持久化）
    const socials = form.socials
      .filter(s => s.name || s.url)
      .map(({ favicon, ...rest }) => rest)

    await userStore.updateProfile({
      namec: form.namec || null,
      avatar: form.avatar || null,
      bio: form.bio || null,
      gender: form.gender || CGender.UNSET,
      birthday: (form.birthdayYear && form.birthdayMonth && form.birthdayDay)
        ? `${form.birthdayYear}-${String(form.birthdayMonth).padStart(2, '0')}-${String(form.birthdayDay).padStart(2, '0')}`
        : null,
      location: serializeLocation(),
      website,
      socials: socials.length > 0 ? socials : null,
    })
    visible.value = false
  }
  catch (err: any)
  {
    console.error('Save profile failed:', err)
  }
  finally
  {
    saving.value = false
  }
}
</script>

<style lang="scss" scoped>
/* 覆盖 dialog 头部样式：柔和渐变 + 小号标题 */
:deep(.u-dialog) {
  --dialog-header-bg-color: linear-gradient(
    135deg,
    var(--u-primary-light-8, rgba(64, 158, 255, 0.08)),
    var(--u-primary-light-9, rgba(64, 158, 255, 0.04))
  );
  --dialog-title-font-size: 1.3rem;

  .u-dialog__header {
    background: var(--dialog-header-bg-color);
    border-bottom: 1px solid var(--u-border-1);

    .u-dialog__title span {
      font-weight: 500;
    }
  }

  /* footer 居中对齐 */
  .u-dialog__footer {
    justify-content: center;
  }
}

.profile-edit {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 0.4rem;

  /* 头像区域 */
  &__avatar-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
  }

  &__avatar-wrap {
    position: relative;
    width: 7.2rem;
    height: 7.2rem;
    border-radius: 50%;
    overflow: hidden;
    cursor: pointer;
    border: 2px solid var(--u-border-1);
    transition: border-color 0.2s ease;

    &:hover {
      border-color: var(--u-primary-0);

      .profile-edit__avatar-overlay {
        opacity: 1;
      }
    }
  }

  &__avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__avatar-placeholder {
    width: 100%;
    height: 100%;
    font-size: 4.4rem;
    color: var(--u-text-3);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__avatar-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.4);
    color: #fff;
    font-size: 1.8rem;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  &__avatar-input {
    display: none;
  }

  &__avatar-hint {
    font-size: 1.2rem;
    color: var(--u-text-3);
  }

  /* 表单区域 */
  &__form {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
  }

  /* 双列行 */
  &__row {
    display: flex;
    gap: 1.6rem;
  }

  /* 字段通用样式 */
  &__field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    width: 100%;

    /* 半宽字段 */
    &--half {
      flex: 1;
      min-width: 0;
    }
  }

  &__label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1.3rem;
    font-weight: 500;
    color: var(--u-text-2);
  }

  /* AI 生成按钮（label 旁的小按钮） */
  &__ai-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    font-size: 1.1rem;
    color: var(--u-primary, #409eff);
    background: transparent;
    border: 1px solid var(--u-primary-light-5, rgba(64, 158, 255, 0.3));
    border-radius: 4px;
    cursor: pointer;
    line-height: 1.6;
    transition: all 0.2s ease;
    font-weight: 400;

    &:hover:not(:disabled) {
      background: var(--u-primary-light, rgba(64, 158, 255, 0.08));
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  /* 网站卡片布局 */
  &__website-card {
    border: 1px solid var(--u-border-1);
    border-radius: 0.8rem;
    padding: 1.2rem;
    background-color: var(--u-background-2, var(--u-background-1));
    transition: border-color 0.2s ease;

    &:hover {
      border-color: var(--u-primary-light-4, var(--u-primary-0));
    }
  }

  &__website-main {
    display: flex;
    gap: 1.2rem;
    align-items: flex-start;
  }

  &__website-icon {
    flex-shrink: 0;
    width: 3.6rem;
    height: 3.6rem;
    border-radius: 0.6rem;
    background-color: var(--u-primary-light-8, rgba(64, 158, 255, 0.08));
    color: var(--u-primary-0);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.6rem;
    margin-top: 0.2rem;
  }

  &__website-fields {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  &__website-meta {
    display: flex;
    gap: 0.8rem;
  }

  /* 社交链接（单行列表式） */
  &__socials {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  &__social-item {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.6rem 0;
    border-bottom: 1px solid var(--u-border-1);

    &:last-of-type {
      border-bottom: none;
    }
  }

  &__social-icon-wrap {
    flex-shrink: 0;
    width: 2.8rem;
    height: 2.8rem;
    border-radius: 0.6rem;
    background-color: var(--u-fill-2, rgba(0, 0, 0, 0.04));
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  &__social-favicon {
    width: 2rem;
    height: 2rem;
    object-fit: contain;
    border-radius: 0.2rem;
  }

  &__social-fa-icon {
    font-size: 1.4rem;
    color: var(--u-text-3);
  }

  &__social-body {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  &__social-badge {
    flex-shrink: 0;
    font-size: 1.1rem;
    color: var(--u-primary-0);
    background-color: var(--u-primary-light-9, rgba(64, 158, 255, 0.06));
    padding: 0.1rem 0.6rem;
    border-radius: 1rem;
    white-space: nowrap;
    line-height: 1.6;
  }

  &__social-remove {
    flex-shrink: 0;
    color: var(--u-danger, #e74c3c);
  }

  /* 所在地（级联 + 详情） */
  &__location {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  /* 生日三级下拉 */
  &__birthday-selects {
    display: flex;
    gap: 0.6rem;
  }

  /* footer 样式（通过 dialog 原生 slot 渲染） */
  &__footer {
    display: flex;
    justify-content: center;
    gap: 1.2rem;
    width: 100%;
  }
}
</style>
