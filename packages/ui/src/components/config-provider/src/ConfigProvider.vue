<!--
  ConfigProvider 配置提供者：向子树提供全局配置（如 locale），通过 slot 暴露 config。
-->
<template>
  <slot :config="config" />
</template>

<script setup lang="ts">
import { useProvideGlobalConfig } from '../composables'
import type { UConfigProviderProps } from '../types'

defineOptions({
  name: 'UConfigProvider'
})

const props = withDefaults(defineProps<UConfigProviderProps>(), {})
// 注入全局配置并供 slot 使用
const config = useProvideGlobalConfig(props)

</script>