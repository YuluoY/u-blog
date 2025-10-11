<template>
  <u-layout mode="column" :gutter="10">
    <u-region v-for="item in latestArticleList" :key="item.id">
       <router-link :to="`/read/${item.id}`">
        <u-text :ellipsis="true" :max-line="1" :title="item.title">{{ item.title }}</u-text>
       </router-link>
    </u-region>
  </u-layout>
</template>

<script lang="ts" setup>
import { useLeftSideStore } from '@/stores/leftSide'
import { storeToRefs } from 'pinia'

defineOptions({
  name: 'LatestArticleCard'
})

const { latestArticleList } = storeToRefs(useLeftSideStore())

</script>
