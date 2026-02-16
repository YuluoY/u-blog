<!--
  Card 卡片：带 header/body/footer 的容器，支持折叠、阴影、内边距与国际化。
-->
<template>
  <article
    :class="[
      'u-card',
      { [`u-card--shadow-${shadow}`]: shadow }
    ]"
  >
    <header
      v-if="$slots.header || header"
      class="u-card-header"
      :style="{ padding: _padding }"
    >
      <slot name="header">
        <span>{{ header }}</span>
        <UIcon
          v-if="collapse"
          :icon="['fas', isCollapse ? 'chevron-down' : 'chevron-up']"
          role="button"
          :aria-expanded="!isCollapse"
          :aria-label="t('card.collapseExpand')"
          @click="isCollapse = !isCollapse"
        />
      </slot>
      <div
        v-show="isNotCollapse"
        class="u-card-header__divider"
      />
    </header>
    <section
      v-if="$slots.default"
      v-show="!isCollapse"
      :class="['u-card-body', bodyClass]"
      :style="_bodyStyle"
    >
      <slot />
    </section>
    <footer
      v-if="$slots.footer || footer"
      class="u-card-footer"
      :style="{ padding: _padding }"
    >
      <slot name="footer">
        <span>{{ footer }}</span>
      </slot>
    </footer>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { UCardProps } from '../types'
import { pxToRem } from '@u-blog/utils'
import { UIcon } from '@/components/icon'
import { useLocale } from '@/components/config-provider'

defineOptions({
  name: 'UCard'
})

const { t } = useLocale()
const props = withDefaults(defineProps<UCardProps>(), {
  padding: 16,
  bodyStyle: () => ({})
})
// 内边距转为 rem，参与响应式
const _padding = computed(() => pxToRem(props.padding))
// body 样式：合并 bodyStyle 与统一 padding
const _bodyStyle = computed(() => ({
  ...props.bodyStyle,
  padding: _padding.value
}))

// 头部折叠状态
const isCollapse = ref(false)
const isNotCollapse = computed(() => !isCollapse.value)
</script>

<style lang="scss">
@forward '../styles/index.scss';
</style>