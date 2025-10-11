
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
const config = useProvideGlobalConfig(props)

</script>