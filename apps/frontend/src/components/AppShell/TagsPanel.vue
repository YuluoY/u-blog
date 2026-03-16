<template>
  <div class="tags-panel">
    <u-text class="tags-panel__title">{{ t('tags.panelTitle') }}</u-text>

    <!-- 词云：权重与声噪可视化（需明确尺寸 + position 以便 canvas 正确绘制） -->
    <div v-if="cloudWords.length" class="tags-panel__wordcloud-wrap">
      <u-text class="tags-panel__section-title">{{ t('tags.wordCloud') }}</u-text>
      <div class="tags-panel__wordcloud-box">
        <vue-word-cloud
          v-if="wordcloudMounted"
          :key="cloudWordsKey"
          class="tags-panel__wordcloud"
          :words="cloudWords"
          :color="cloudColor"
          font-family="system-ui, sans-serif"
          :font-size-ratio="4"
          :spacing="0.5"
          style="position: absolute; left: 0; top: 0; width: 100%; height: 100%;"
        >
          <template #default="{ text, weight, word }">
            <div
              class="tags-panel__wordcloud-word"
              :title="cloudWordTitle(text, weight)"
              :style="cloudWordStyle(word)"
              @click="onCloudWordClick(word)"
            >
              {{ text }}
            </div>
          </template>
        </vue-word-cloud>
      </div>
    </div>

    <!-- 类别 -->
    <div class="tags-panel__section">
      <u-text class="tags-panel__section-title">{{ t('tags.categories') }}</u-text>
      <div v-if="categoryList.length" class="tags-panel__cloud">
        <span
          v-for="cat in categoryList"
          :key="cat.id"
          class="tags-panel__chip"
          :class="{ 'is-selected': selectedCategoryIds.includes(cat.id) }"
          :title="cat.name"
          @click="toggleCategory(cat.id)"
        >
          {{ cat.name }}
        </span>
      </div>
      <u-text v-else class="tags-panel__empty">{{ t('tags.noCategories') }}</u-text>
    </div>

    <!-- 标签 -->
    <div class="tags-panel__section">
      <u-text class="tags-panel__section-title">{{ t('tags.tagLabel') }}</u-text>
      <div v-if="tagList.length" class="tags-panel__cloud">
        <span
          v-for="tag in tagList"
          :key="tag.id"
          class="tags-panel__tag"
          :class="{ 'is-selected': selectedTagIds.includes(tag.id) }"
          :style="tagStyle(tag)"
          :title="tag.name"
          @click="toggleTag(tag.id)"
        >
          {{ tag.name }}
        </span>
      </div>
      <u-text v-else class="tags-panel__empty">{{ t('tags.empty') }}</u-text>
    </div>

    <!-- 筛选模式 -->
    <div class="tags-panel__section">
      <u-text class="tags-panel__section-title">{{ t('tags.filterMode') }}</u-text>
      <div class="tags-panel__filter-mode">
        <label class="tags-panel__radio">
          <input
            v-model="filterMode"
            type="radio"
            value="or"
          >
          <span>{{ t('tags.filterModeAny') }}</span>
        </label>
        <label class="tags-panel__radio">
          <input
            v-model="filterMode"
            type="radio"
            value="and"
          >
          <span>{{ t('tags.filterModeAll') }}</span>
        </label>
      </div>
    </div>

    <!-- 去归档 -->
    <u-button
      class="tags-panel__btn"
      type="primary"
      :disabled="!hasSelection"
      @click="goToArchive"
    >
      {{ t('tags.goToArchive') }}
    </u-button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
// 异步加载 vuewordcloud，避免 ~40KB 打入首屏主 chunk
import { defineAsyncComponent } from 'vue'
const VueWordCloud = defineAsyncComponent(() => import('vuewordcloud'))
import { useTagStore } from '@/stores/model/tag'
import { useCategoryStore } from '@/stores/model/category'
import { storeToRefs } from 'pinia'
import { ref, computed, onMounted, nextTick } from 'vue'
import { getCloudWeights } from '@/api/cloudWeights'
import type { CloudWeightsData } from '@/api/cloudWeights'

defineOptions({ name: 'TagsPanel' })

const { t } = useI18n()
const router = useRouter()
const tagStore = useTagStore()
const categoryStore = useCategoryStore()

const { tagList } = storeToRefs(tagStore)
const { categoryList } = storeToRefs(categoryStore)

const selectedCategoryIds = ref<number[]>([])
const selectedTagIds = ref<number[]>([])
const filterMode = ref<'or' | 'and'>('and')
const cloudData = ref<CloudWeightsData | null>(null)
const wordcloudMounted = ref(false)
const cloudWordsKey = ref(0)

/** 词云单项：含 type/id 便于点击选中与悬停提示 */
interface CloudWordItem {
  text: string
  weight: number
  id: number
  type: 'category' | 'tag'
  color?: string | null
}

const cloudWords = computed(() =>
{
  const d = cloudData.value
  if (!d) return []
  const catWords: CloudWordItem[] = d.categories.map(c => ({
    text: c.name,
    weight: Math.max(1, c.weight),
    id: c.id,
    type: 'category',
  }))
  const tagWords: CloudWordItem[] = d.tags.map(t => ({
    text: t.name,
    weight: Math.max(1, t.weight),
    id: t.id,
    type: 'tag',
    color: t.color ?? undefined,
  }))
  return [...catWords, ...tagWords]
})

const cloudNameToColor = computed(() =>
{
  const d = cloudData.value
  if (!d) return new Map<string, string>()
  const m = new Map<string, string>()
  d.tags.forEach(t =>
  {
    if (t.color) m.set(t.name, t.color)
  })
  return m
})

function cloudColor(word: [string, number] | CloudWordItem | unknown)
{
  let raw: string | undefined
  if (word && typeof word === 'object' && 'text' in word)
  {
    const w = word as CloudWordItem
    raw = w.color ?? cloudNameToColor.value.get(w.text)
  }
  else
  {
    const text = Array.isArray(word) ? String(word[0]) : ''
    raw = cloudNameToColor.value.get(text)
  }
  if (!raw) return 'var(--u-primary-0)'
  // CSS color 不支持渐变，提取首色
  if (raw.startsWith('linear-gradient') || raw.startsWith('radial-gradient'))
  {
    const rgb = parseColorRGB(raw)
    if (rgb) return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`
  }
  return raw
}

function cloudWordTitle(text: string, weight: number)
{
  return `${text} · ${weight} ${t('tags.articlesCount')}`
}

function cloudWordStyle(word: CloudWordItem)
{
  const color = word.color ?? cloudNameToColor.value.get(word.text) ?? 'var(--u-primary-0)'
  // CSS color 不支持渐变值，需要从渐变中提取首个颜色
  const isGradient = typeof color === 'string' && (color.startsWith('linear-gradient') || color.startsWith('radial-gradient'))
  if (isGradient)
  {
    const rgb = parseColorRGB(color)
    if (rgb) return { color: `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`, cursor: 'pointer' }
  }
  return { color, cursor: 'pointer' }
}

function onCloudWordClick(word: CloudWordItem)
{
  if (word.type === 'category') toggleCategory(word.id)
  else toggleTag(word.id)
}

const hasSelection = computed(
  () => selectedCategoryIds.value.length > 0 || selectedTagIds.value.length > 0
)

function toggleCategory(id: number)
{
  const idx = selectedCategoryIds.value.indexOf(id)
  if (idx === -1) selectedCategoryIds.value = [...selectedCategoryIds.value, id]
  else selectedCategoryIds.value = selectedCategoryIds.value.filter(x => x !== id)
}

function toggleTag(id: number)
{
  const idx = selectedTagIds.value.indexOf(id)
  if (idx === -1) selectedTagIds.value = [...selectedTagIds.value, id]
  else selectedTagIds.value = selectedTagIds.value.filter(x => x !== id)
}

function goToArchive()
{
  if (!hasSelection.value) return
  const query: Record<string, string> = {}
  if (selectedCategoryIds.value.length) query.categoryIds = selectedCategoryIds.value.join(',')
  if (selectedTagIds.value.length) query.tagIds = selectedTagIds.value.join(',')
  query.filterMode = filterMode.value
  router.push({ path: '/archive', query })
}

/**
 * 将任意 CSS 颜色字符串解析为 [r, g, b] 数组
 * 支持 hex (#abc / #aabbcc)、rgb(r,g,b)、rgba(r,g,b,a) 以及渐变取首色
 */
function parseColorRGB(color: string): [number, number, number] | null
{
  // 如果是渐变，提取第一个颜色（支持 hex / rgb / rgba / hsl / hsla）
  const gradientMatch = color.match(/#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)/)
  const c = gradientMatch ? gradientMatch[0] : color.trim()

  // hex 格式
  const hexMatch = c.match(/^#([0-9a-fA-F]{3,8})$/)
  if (hexMatch)
  {
    const hex = hexMatch[1]
    if (hex.length === 3)
    
      return [parseInt(hex[0] + hex[0], 16), parseInt(hex[1] + hex[1], 16), parseInt(hex[2] + hex[2], 16)]
    
    if (hex.length >= 6)
    
      return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)]
    
  }

  // rgb / rgba 格式
  const rgbMatch = c.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  if (rgbMatch)
  
    return [Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3])]
  

  // hsl / hsla 格式 → 转换为 RGB
  const hslMatch = c.match(/hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/)
  if (hslMatch)
  {
    const h = Number(hslMatch[1]) / 360
    const s = Number(hslMatch[2]) / 100
    const l = Number(hslMatch[3]) / 100
    const hue2rgb = (p: number, q: number, t: number) =>
    {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    let r: number, g: number, b: number
    if (s === 0)
      r = g = b = l
    else
    {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      r = hue2rgb(p, q, h + 1 / 3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1 / 3)
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
  }

  return null
}

function tagStyle(tag: { color?: string })
{
  const c = tag.color
  if (!c) return {}

  const rgb = parseColorRGB(c)
  if (!rgb) return { color: c }

  const [r, g, b] = rgb
  return {
    '--tag-bg': `rgba(${r}, ${g}, ${b}, 0.1)`,
    '--tag-color': c,
    color: `rgb(${r}, ${g}, ${b})`,
    backgroundColor: `rgba(${r}, ${g}, ${b}, 0.1)`,
    borderColor: `rgba(${r}, ${g}, ${b}, 0.25)`,
  }
}

onMounted(() =>
{
  categoryStore.qryCategoryList()
  tagStore.qryTagList()
  getCloudWeights()
    .then(data =>
    {
      cloudData.value = data
      nextTick(() =>
      {
        wordcloudMounted.value = true
        cloudWordsKey.value += 1
      })
    })
    .catch(() =>
    {})
})
</script>

<style lang="scss" scoped>
.tags-panel {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__title {
    font-weight: 600;
    font-size: 1.6rem;
    color: var(--u-text-1);
    display: block;
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__section-title {
    font-size: 1.2rem;
    font-weight: 500;
    color: var(--u-text-2);
    display: block;
  }

  &__cloud {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__chip,
  &__tag {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 1.2rem;
    font-weight: 500;
    border: 1px solid transparent;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.15s, box-shadow 0.15s;

    &:hover {
      opacity: 0.85;
      transform: translateY(-1px);
    }

    &.is-selected {
      box-shadow: 0 0 0 2px var(--u-primary-0);
    }
  }

  &__chip {
    background: var(--u-background-2);
    color: var(--u-text-1);
    border-color: var(--u-border-1);
  }

  &__filter-mode {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  &__radio {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-size: 1.2rem;
    color: var(--u-text-2);

    input {
      margin: 0;
    }
  }

  &__btn {
    margin-top: 4px;
  }

  &__empty {
    font-size: 1.3rem;
    color: var(--u-text-3);
    display: block;
  }

  &__wordcloud-wrap {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__wordcloud-box {
    position: relative;
    width: 100%;
    min-width: 200px;
    height: 180px;
    border-radius: 8px;
    overflow: hidden;
  }

  &__wordcloud {
    display: block;
  }

  &__wordcloud-word {
    cursor: pointer;
    &:hover {
      opacity: 0.85;
    }
  }
}
</style>
