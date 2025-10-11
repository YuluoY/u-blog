<template>
  <u-layout>
    <u-region region="center">
      <MdEditor v-model="text" @on-save="handleSave" />
    </u-region>
  </u-layout>
</template>

<script setup lang="ts">
import { MdEditor } from 'md-editor-v3'
import 'md-editor-v3/lib/style.css'
import { UDialogFn } from '@u-blog/ui'

defineOptions({
  name: 'WriteView'
})

const text = ref<string>('')

const handleSave = (text: string) =>
{
  console.log(text)
  UDialogFn({
    title: '保存',
    content: '确定保存吗？'
  })
}

</script>