<template>
  <u-drawer
    :model-value="modelValue"
    placement="right"
    :width="420"
    :title="t('settings.title')"
    @update:model-value="onVisibleChange"
  >
    <u-tabs v-model="activeTab" :tabs="tabOptions" class="settings-drawer__tabs">
      <template #default="{ activeKey }">
        <!-- 外观 -->
        <div v-show="activeKey === 'appearance'" class="settings-drawer__pane">
          <div class="settings-drawer__card">
          <div class="settings-drawer__item">
            <div class="settings-drawer__item-head">
              <span class="settings-drawer__title-box">
                <span class="settings-drawer__label">{{ t('settings.theme') }}</span>
                <u-tooltip :content="t('settings.themeHint')" placement="top" trigger="hover" :width="0" show-arrow>
                  <span class="settings-drawer__help" aria-label="?">
                    <u-icon icon="fa-solid fa-circle-question" />
                  </span>
                </u-tooltip>
              </span>
            </div>
            <div class="settings-drawer__control">
              <u-button
                :type="theme === 'dark' ? 'primary' : undefined"
                :plain="theme !== 'dark'"
                size="small"
                class="settings-drawer__block"
                @click="theme !== 'dark' && appStore.setTheme('dark')"
              >
                <u-icon icon="fa-solid fa-moon" />
                {{ t('settings.dark') }}
              </u-button>
              <u-button
                :type="theme === 'default' ? 'primary' : undefined"
                :plain="theme !== 'default'"
                size="small"
                class="settings-drawer__block"
                @click="theme !== 'default' && appStore.setTheme('default')"
              >
                <u-icon icon="fa-solid fa-sun" />
                {{ t('settings.light') }}
              </u-button>
            </div>
          </div>
          </div>
          <div class="settings-drawer__card">
          <div class="settings-drawer__item">
            <div class="settings-drawer__item-head">
              <span class="settings-drawer__title-box">
                <span class="settings-drawer__label">{{ t('settings.language') }}</span>
                <u-tooltip :content="t('settings.languageHint')" placement="top" trigger="hover" :width="0" show-arrow>
                  <span class="settings-drawer__help" aria-label="?">
                    <u-icon icon="fa-solid fa-circle-question" />
                  </span>
                </u-tooltip>
              </span>
            </div>
            <div class="settings-drawer__control">
              <u-button
                :type="language === 'zh' ? 'primary' : undefined"
                :plain="language !== 'zh'"
                size="small"
                class="settings-drawer__block"
                @click="appStore.setLanguage('zh')"
              >
                {{ t('settings.zh') }}
              </u-button>
              <u-button
                :type="language === 'en' ? 'primary' : undefined"
                :plain="language !== 'en'"
                size="small"
                class="settings-drawer__block"
                @click="appStore.setLanguage('en')"
              >
                {{ t('settings.en') }}
              </u-button>
            </div>
          </div>
          </div>
          <div class="settings-drawer__card">
          <div class="settings-drawer__item">
            <div class="settings-drawer__item-head">
              <span class="settings-drawer__title-box">
                <span class="settings-drawer__label">{{ t('settings.listStyle') }}</span>
                <u-tooltip :content="t('settings.listStyleHint')" placement="top" trigger="hover" :width="0" show-arrow>
                  <span class="settings-drawer__help" aria-label="?">
                    <u-icon icon="fa-solid fa-circle-question" />
                  </span>
                </u-tooltip>
              </span>
            </div>
            <div class="settings-drawer__control">
              <u-button
                v-for="opt in listTypeOptions"
                :key="opt.value"
                :type="currentListType === opt.value ? 'primary' : undefined"
                :plain="currentListType !== opt.value"
                size="small"
                class="settings-drawer__block"
                @click="handleListTypeChange(opt.value)"
              >
                <u-icon :icon="opt.icon" />
                {{ opt.label }}
              </u-button>
            </div>
          </div>
          </div>
          <div class="settings-drawer__card">
          <div class="settings-drawer__item">
            <div class="settings-drawer__item-head">
              <span class="settings-drawer__title-box">
                <span class="settings-drawer__label">{{ t('settings.homeSort') }}</span>
                <u-tooltip :content="t('settings.homeSortHint')" placement="top" trigger="hover" :width="0" show-arrow>
                  <span class="settings-drawer__help" aria-label="?">
                    <u-icon icon="fa-solid fa-circle-question" />
                  </span>
                </u-tooltip>
              </span>
            </div>
            <div class="settings-drawer__control">
              <u-button
                v-for="opt in homeSortOptions"
                :key="opt.value"
                :type="currentHomeSort === opt.value ? 'primary' : undefined"
                :plain="currentHomeSort !== opt.value"
                size="small"
                class="settings-drawer__block"
                @click="handleHomeSortChange(opt.value)"
              >
                {{ opt.label }}
              </u-button>
            </div>
          </div>
          </div>
          <!-- 暂时隐藏【视觉样式】，恢复时去掉 v-if="false" -->
          <div v-if="false" class="settings-drawer__card">
          <div class="settings-drawer__item">
            <div class="settings-drawer__item-head">
              <span class="settings-drawer__title-box">
                <span class="settings-drawer__label">{{ t('settings.visualStyle') }}</span>
                <u-tooltip :content="t('settings.visualStyleHint')" placement="top" trigger="hover" :width="0" show-arrow>
                  <span class="settings-drawer__help" aria-label="?">
                    <u-icon icon="fa-solid fa-circle-question" />
                  </span>
                </u-tooltip>
              </span>
            </div>
            <div class="settings-drawer__control">
              <u-button
                :type="visualStyle === 'default' ? 'primary' : undefined"
                :plain="visualStyle !== 'default'"
                size="small"
                class="settings-drawer__block"
                @click="appStore.setVisualStyle('default')"
              >
                <u-icon icon="fa-solid fa-square" />
                {{ t('settings.visualDefault') }}
              </u-button>
              <u-button
                :type="visualStyle === 'glass' ? 'primary' : undefined"
                :plain="visualStyle !== 'glass'"
                size="small"
                class="settings-drawer__block"
                @click="appStore.setVisualStyle('glass')"
              >
                <u-icon icon="fa-solid fa-glass-water" />
                {{ t('settings.visualGlass') }}
              </u-button>
            </div>
          </div>
          </div>
          <div class="settings-drawer__card">
          <div class="settings-drawer__item">
            <div class="settings-drawer__item-head">
              <span class="settings-drawer__title-box">
                <span class="settings-drawer__label">{{ t('settings.archiveCardStyle') }}</span>
                <u-tooltip :content="t('settings.archiveCardStyleHint')" placement="top" trigger="hover" :width="0" show-arrow>
                  <span class="settings-drawer__help" aria-label="?">
                    <u-icon icon="fa-solid fa-circle-question" />
                  </span>
                </u-tooltip>
              </span>
            </div>
            <div class="settings-drawer__control">
              <u-button
                v-for="opt in archiveCardStyleOptions"
                :key="opt.value"
                :type="appStore.archiveCardStyle === opt.value ? 'primary' : undefined"
                :plain="appStore.archiveCardStyle !== opt.value"
                size="small"
                class="settings-drawer__block"
                @click="appStore.setArchiveCardStyle(opt.value)"
              >
                {{ opt.label }}
              </u-button>
            </div>
          </div>
          </div>
          <div class="settings-drawer__card">
            <div class="settings-drawer__item">
              <div class="settings-drawer__item-head">
                <span class="settings-drawer__title-box">
                  <span class="settings-drawer__label">{{ t('settings.snowfall') }}</span>
                  <u-tooltip :content="t('settings.snowfallHint')" placement="top" trigger="hover" :width="0" show-arrow>
                    <span class="settings-drawer__help" aria-label="?">
                      <u-icon icon="fa-solid fa-circle-question" />
                    </span>
                  </u-tooltip>
                </span>
              </div>
              <div class="settings-drawer__control settings-drawer__control--row">
                <u-button
                  :type="appStore.snowfallMode === 'off' ? 'primary' : undefined"
                  :plain="appStore.snowfallMode !== 'off'"
                  size="small"
                  class="settings-drawer__block"
                  @click="appStore.setSnowfallMode('off')"
                >
                  {{ t('settings.snowfallOff') }}
                </u-button>
                <u-button
                  :type="appStore.snowfallMode === 'auto' ? 'primary' : undefined"
                  :plain="appStore.snowfallMode !== 'auto'"
                  size="small"
                  class="settings-drawer__block"
                  @click="appStore.setSnowfallMode('auto')"
                >
                  {{ t('settings.snowfallAuto') }}
                </u-button>
                <u-button
                  :type="appStore.snowfallMode === 'on' ? 'primary' : undefined"
                  :plain="appStore.snowfallMode !== 'on'"
                  size="small"
                  class="settings-drawer__block"
                  @click="appStore.setSnowfallMode('on')"
                >
                  {{ t('settings.snowfallOn') }}
                </u-button>
              </div>
            </div>
            <div class="settings-drawer__item settings-drawer__item--spaced">
              <div class="settings-drawer__item-head">
                <span class="settings-drawer__label">{{ t('settings.snowfallCount') }}</span>
                <span class="settings-drawer__value">{{ appStore.snowfallCount }}</span>
              </div>
              <u-slider v-model="snowfallCountLocal" :min="8" :max="120" :step="4" />
            </div>
            <div class="settings-drawer__item settings-drawer__item--spaced">
              <div class="settings-drawer__item-head">
                <span class="settings-drawer__label">{{ t('settings.snowfallSize') }}</span>
                <span class="settings-drawer__value">{{ appStore.snowfallSizeMin }}–{{ appStore.snowfallSizeMax }} px</span>
              </div>
              <div class="settings-drawer__slider-row">
<u-slider v-model="snowfallSizeMinLocal" :min="2" :max="24" :step="1" class="settings-drawer__slider-half" />
              <u-slider v-model="snowfallSizeMaxLocal" :min="2" :max="24" :step="1" class="settings-drawer__slider-half" />
              </div>
              <div class="settings-drawer__hint">{{ t('settings.snowfallSizeHint') }}</div>
            </div>
            <div class="settings-drawer__item settings-drawer__item--spaced">
              <div class="settings-drawer__item-head">
                <span class="settings-drawer__label">{{ t('settings.snowfallSpeed') }}</span>
                <span class="settings-drawer__value">{{ appStore.snowfallSpeed }}</span>
              </div>
              <u-slider v-model="snowfallSpeedLocal" :min="1" :max="10" :step="1" />
              <div class="settings-drawer__hint">{{ t('settings.snowfallSpeedHint') }}</div>
            </div>
            <div class="settings-drawer__item settings-drawer__item--spaced">
              <div class="settings-drawer__item-head">
                <span class="settings-drawer__label">{{ t('settings.snowfallDistribution') }}</span>
                <span class="settings-drawer__value">{{ appStore.snowfallDistribution }}%</span>
              </div>
              <u-slider v-model="snowfallDistributionLocal" :min="0" :max="100" :step="5" />
              <div class="settings-drawer__hint">{{ t('settings.snowfallDistributionHint') }}</div>
            </div>
            <div class="settings-drawer__item settings-drawer__item--spaced">
              <div class="settings-drawer__item-head">
                <span class="settings-drawer__label">{{ t('settings.snowfallZIndex') }}</span>
              </div>
              <u-input
                v-model.number="snowfallZIndexLocal"
                type="number"
                :min="1"
                :max="99999"
                class="settings-drawer__input settings-drawer__input--short"
                @blur="commitSnowfallZIndex"
              />
            </div>
            <div class="settings-drawer__item settings-drawer__item--spaced">
              <div class="settings-drawer__item-head">
                <span class="settings-drawer__label">{{ t('settings.snowfallTheme') }}</span>
              </div>
              <div class="settings-drawer__control">
                <u-button
                  :type="appStore.snowfallThemePreset === 'default' ? 'primary' : undefined"
                  :plain="appStore.snowfallThemePreset !== 'default'"
                  size="small"
                  class="settings-drawer__block"
                  @click="appStore.setSnowfallThemePreset('default')"
                >
                  {{ t('settings.snowfallThemeDefault') }}
                </u-button>
                <u-button
                  :type="appStore.snowfallThemePreset === 'ice' ? 'primary' : undefined"
                  :plain="appStore.snowfallThemePreset !== 'ice'"
                  size="small"
                  class="settings-drawer__block"
                  @click="appStore.setSnowfallThemePreset('ice')"
                >
                  {{ t('settings.snowfallThemeIce') }}
                </u-button>
              </div>
            </div>
          </div>
        </div>
        <!-- 在线模型 -->
        <div v-show="activeKey === 'model'" class="settings-drawer__pane">
          <div class="settings-drawer__card">
          <div class="settings-drawer__item">
            <div class="settings-drawer__item-head">
              <span class="settings-drawer__title-box">
                <span class="settings-drawer__label">{{ t('settings.openaiKeyShort') }}</span>
                <u-tooltip :content="t('settings.openaiKeyPlaceholder')" placement="top" trigger="hover" :width="0" show-arrow>
                  <span class="settings-drawer__help" aria-label="?">
                    <u-icon icon="fa-solid fa-circle-question" />
                  </span>
                </u-tooltip>
              </span>
            </div>
            <u-input
              v-model="form.openai_api_key"
              type="password"
              :placeholder="t('settings.openaiKeyShort')"
              show-password
              class="settings-drawer__input"
            />
          </div>
          </div>
          <div class="settings-drawer__card">
          <div class="settings-drawer__item">
            <div class="settings-drawer__item-head">
              <span class="settings-drawer__title-box">
                <span class="settings-drawer__label">{{ t('settings.openaiBaseShort') }}</span>
                <u-tooltip :content="t('settings.openaiBasePlaceholder')" placement="top" trigger="hover" :width="0" show-arrow>
                  <span class="settings-drawer__help" aria-label="?">
                    <u-icon icon="fa-solid fa-circle-question" />
                  </span>
                </u-tooltip>
              </span>
            </div>
            <u-input
              v-model="form.openai_base_url"
              type="text"
              :placeholder="t('settings.openaiBaseShort')"
              class="settings-drawer__input"
            />
          </div>
          </div>
          <div class="settings-drawer__card">
          <div class="settings-drawer__item">
            <div class="settings-drawer__item-head">
              <span class="settings-drawer__title-box">
                <span class="settings-drawer__label">{{ t('settings.modelShort') }}</span>
                <u-tooltip :content="t('settings.modelPlaceholder')" placement="top" trigger="hover" :width="0" show-arrow>
                  <span class="settings-drawer__help" aria-label="?">
                    <u-icon icon="fa-solid fa-circle-question" />
                  </span>
                </u-tooltip>
              </span>
            </div>
            <u-input
              v-model="form.openai_model"
              type="text"
              :placeholder="t('settings.modelShort')"
              class="settings-drawer__input"
            />
          </div>
          </div>
          <u-button type="primary" size="default" :loading="savingModel" class="settings-drawer__save" @click="saveModelSettings">
            <u-icon icon="fa-solid fa-save" />
            {{ t('settings.saveModel') }}
          </u-button>
        </div>
        <!-- 站点信息 -->
        <div v-show="activeKey === 'site'" class="settings-drawer__pane">
          <div class="settings-drawer__card">
          <div class="settings-drawer__item">
            <div class="settings-drawer__item-head">
              <span class="settings-drawer__title-box">
                <span class="settings-drawer__label">{{ t('settings.siteNameShort') }}</span>
                <u-tooltip :content="t('settings.siteNamePlaceholder')" placement="top" trigger="hover" :width="0" show-arrow>
                  <span class="settings-drawer__help" aria-label="?">
                    <u-icon icon="fa-solid fa-circle-question" />
                  </span>
                </u-tooltip>
              </span>
            </div>
            <u-input v-model="form.site_name" type="text" :placeholder="t('settings.siteNameShort')" class="settings-drawer__input" />
          </div>
          </div>
          <div class="settings-drawer__card">
          <div class="settings-drawer__item">
            <div class="settings-drawer__item-head">
              <span class="settings-drawer__title-box">
                <span class="settings-drawer__label">{{ t('settings.siteDescShort') }}</span>
                <u-tooltip :content="t('settings.siteDescPlaceholder')" placement="top" trigger="hover" :width="0" show-arrow>
                  <span class="settings-drawer__help" aria-label="?">
                    <u-icon icon="fa-solid fa-circle-question" />
                  </span>
                </u-tooltip>
              </span>
            </div>
            <u-input v-model="form.site_description" type="text" :placeholder="t('settings.siteDescShort')" class="settings-drawer__input" />
          </div>
          </div>
          <div class="settings-drawer__card">
          <div class="settings-drawer__item">
            <div class="settings-drawer__item-head">
              <span class="settings-drawer__title-box">
                <span class="settings-drawer__label">{{ t('settings.siteKeywordsShort') }}</span>
                <u-tooltip :content="t('settings.siteKeywordsPlaceholder')" placement="top" trigger="hover" :width="0" show-arrow>
                  <span class="settings-drawer__help" aria-label="?">
                    <u-icon icon="fa-solid fa-circle-question" />
                  </span>
                </u-tooltip>
              </span>
            </div>
            <u-input v-model="form.site_keywords" type="text" :placeholder="t('settings.siteKeywordsShort')" class="settings-drawer__input" />
          </div>
          </div>
          <u-button type="primary" size="default" :loading="savingSite" class="settings-drawer__save" @click="saveSiteSettings">
            <u-icon icon="fa-solid fa-save" />
            {{ t('settings.saveSite') }}
          </u-button>
        </div>
      </template>
    </u-tabs>
  </u-drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/app'
import { useSettingsForm } from '@/composables/useSettingsForm'
import { CArchiveCardStyle } from '@/constants/archive'
import type { ArchiveCardStyle } from '@/constants/archive'

defineOptions({ name: 'SettingsDrawer' })

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const { t } = useI18n()

const {
  form,
  theme,
  language,
  visualStyle,
  currentListType,
  listTypeOptions,
  currentHomeSort,
  homeSortOptions,
  savingModel,
  savingSite,
  loadServerSettings,
  handleListTypeChange,
  handleHomeSortChange,
  saveModelSettings,
  saveSiteSettings,
  appStore,
} = useSettingsForm()

const activeTab = ref('appearance')

const archiveCardStyleOptions = computed(() => [
  { value: CArchiveCardStyle.SUMMARY_TAGS as ArchiveCardStyle, label: t('archive.cardStyleSummaryTags') },
  { value: CArchiveCardStyle.COVER_INFO as ArchiveCardStyle, label: t('archive.cardStyleCoverInfo') },
  { value: CArchiveCardStyle.MINIMAL_EXPAND as ArchiveCardStyle, label: t('archive.cardStyleMinimalExpand') },
  { value: CArchiveCardStyle.STATS_BAR as ArchiveCardStyle, label: t('archive.cardStyleStatsBar') },
  { value: CArchiveCardStyle.TIMELINE_TAGS as ArchiveCardStyle, label: t('archive.cardStyleTimelineTags') },
  { value: CArchiveCardStyle.MAGAZINE as ArchiveCardStyle, label: t('archive.cardStyleMagazine') },
])

const snowfallCountLocal = ref(appStore.snowfallCount)
const snowfallSizeMinLocal = ref(appStore.snowfallSizeMin)
const snowfallSizeMaxLocal = ref(appStore.snowfallSizeMax)
const snowfallSpeedLocal = ref(appStore.snowfallSpeed)
const snowfallDistributionLocal = ref(appStore.snowfallDistribution)
const snowfallZIndexLocal = ref(appStore.snowfallZIndex)
watch(() => appStore.snowfallCount, (v) => { snowfallCountLocal.value = v })
watch(() => appStore.snowfallSizeMin, (v) => { snowfallSizeMinLocal.value = v })
watch(() => appStore.snowfallSizeMax, (v) => { snowfallSizeMaxLocal.value = v })
watch(() => appStore.snowfallSpeed, (v) => { snowfallSpeedLocal.value = v })
watch(() => appStore.snowfallDistribution, (v) => { snowfallDistributionLocal.value = v })
watch(() => appStore.snowfallZIndex, (v) => { snowfallZIndexLocal.value = v })
watch(snowfallCountLocal, (v) => {
  const n = Number(v)
  if (!Number.isNaN(n)) appStore.setSnowfallCount(n)
})
watch(snowfallSizeMinLocal, (v) => {
  const n = Number(v)
  if (!Number.isNaN(n)) appStore.setSnowfallSizeMin(n)
})
watch(snowfallSizeMaxLocal, (v) => {
  const n = Number(v)
  if (!Number.isNaN(n)) appStore.setSnowfallSizeMax(n)
})
watch(snowfallSpeedLocal, (v) => {
  const n = Number(v)
  if (!Number.isNaN(n)) appStore.setSnowfallSpeed(n)
})
watch(snowfallDistributionLocal, (v) => {
  const n = Number(v)
  if (!Number.isNaN(n)) appStore.setSnowfallDistribution(n)
})
function commitSnowfallZIndex() {
  const n = Number(snowfallZIndexLocal.value)
  if (!Number.isNaN(n)) appStore.setSnowfallZIndex(n)
  else snowfallZIndexLocal.value = appStore.snowfallZIndex
}

const tabOptions = computed(() => [
  { key: 'appearance', label: t('settings.tabAppearance'), icon: 'fa-solid fa-palette' },
  { key: 'model', label: t('settings.tabModel'), icon: 'fa-solid fa-microchip' },
  { key: 'site', label: t('settings.tabSite'), icon: 'fa-solid fa-globe' },
])

function onVisibleChange(v: boolean) {
  emit('update:modelValue', v)
  if (v) loadServerSettings()
}

watch(
  () => props.modelValue,
  (v) => {
    if (v) loadServerSettings()
  }
)
</script>

<style lang="scss" scoped>
.settings-drawer__tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.settings-drawer__pane {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.settings-drawer__card {
  border-radius: var(--u-border-radius-8, 0.8rem);
  background: var(--u-background-2);
  border: 1px solid var(--u-border-1, rgba(255, 255, 255, 0.08));
  padding: 1.2rem 1.4rem;
  transition: filter 0.2s ease;

  &:hover {
    filter: brightness(1.03);
  }
}

.settings-drawer__item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.settings-drawer__item--spaced {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--u-border-1, rgba(255, 255, 255, 0.08));
}

.settings-drawer__item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 28px;
}

.settings-drawer__value {
  font-size: 1.2rem;
  color: var(--u-text-2);
  font-variant-numeric: tabular-nums;
}

.settings-drawer__input--short {
  max-width: 120px;
}

.settings-drawer__control--row {
  flex-wrap: wrap;
}

.settings-drawer__slider-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.settings-drawer__slider-half {
  flex: 1;
  min-width: 0;
}

.settings-drawer__hint {
  font-size: 1.1rem;
  color: var(--u-text-3);
  margin-top: 4px;
}

/* 标题与问号：title-box 仅包住标题文字宽度，问号绝对定位于其右上角 */
.settings-drawer__item-head .settings-drawer__title-box {
  min-height: 28px;
}

.settings-drawer__title-box {
  position: relative;
  display: inline-block;
  padding-right: 26px;
  max-width: 100%;
}

/* 问号（tooltip 触发块）定位于标题盒子右上角，略上移以贴合「右上方」 */
.settings-drawer__title-box :deep(.u-tooltip) {
  position: absolute !important;
  top: -0.15em !important;
  right: 0 !important;
  left: auto !important;
  bottom: auto !important;
}

.settings-drawer__title-box :deep(.u-tooltip__trigger) {
  width: 24px !important;
  height: 24px !important;
  min-width: 24px;
  min-height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.settings-drawer__label {
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--u-text-1);
}

.settings-drawer__help {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: var(--u-text-3);
  cursor: help;
  transition: color 0.15s;

  &:hover {
    color: var(--u-primary-0);
  }

  .u-icon {
    font-size: 1.1rem;
  }
}

.settings-drawer__control {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px 10px;
  justify-content: start;
  width: 100%;

  /* 取消 u-button 自带的 &+.u-button { margin-left }，由 grid gap 统一控制间距 */
  :deep(.u-button) {
    margin: 0 !important;
  }
}

/* 块状选项：小尺寸、等宽、左对齐（每格固定一列） */
.settings-drawer__block {
  min-width: 0;
  border-radius: var(--u-border-radius-4, 0.4rem) !important;
  min-height: 28px;
  padding: 0 0.6rem !important;
  font-size: var(--u-font-size-sm, 1rem) !important;
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  transition: filter 0.2s ease;

  .u-icon {
    font-size: 1rem;
  }

  &:hover {
    filter: brightness(1.12);
  }
}

.settings-drawer__input {
  width: 100%;
}

.settings-drawer__save {
  margin-top: 8px;
}
</style>
