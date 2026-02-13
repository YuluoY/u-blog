<template>
  <u-layout>
    <u-region region="center">
      <component v-if="Preview && articleContent" :is="Preview" :key="route.params.id"></component>
      <component v-if="Catalog" :is="Catalog"></component>
    </u-region>
  </u-layout>
</template>

<script lang="ts" setup>
import { usePreviewMd } from '@/composables/usePreviewMd'
import { watch } from 'vue'

defineOptions({
  name: 'ReadView'
})

const route = useRoute()
const { Preview, Catalog, articleContent } = usePreviewMd({ articleId: route.params.id as string })

// 监听路由变化，重新初始化
watch(() => route.params.id, (newId) => {
  if (newId) {
    // 路由变化时会自动触发 usePreviewMd 内部的 watch
  }
}, { immediate: true })

</script>