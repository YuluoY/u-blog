<template>
  <u-layout>
    <u-region region="center">
      <component v-if="Preview" :is="Preview"></component>
      <component v-if="Catalog" :is="Catalog"></component>
    </u-region>
  </u-layout>
</template>

<script lang="ts" setup>
import { usePreviewMd } from '@/composables/usePreviewMd'

defineOptions({
  name: 'ReadView'
})

const route = useRoute()
const { Preview, Catalog } = usePreviewMd({ articleId: route.params.id as string })

</script>