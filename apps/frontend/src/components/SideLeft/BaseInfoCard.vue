<template>
  <u-layout class="base-info-card" mode="column" :gutter="16">
    <u-region class="base-info-card__avatar" justify="center">
      <img :src="user.avatar" :alt="user.namec" />
    </u-region>
    <u-region class="base-info-card__name" justify="center">
      {{ user.namec }}
    </u-region>
    <u-region class="base-info-card__info">
      <div class="base-info-card__info-item">
        <div>文章</div>
        <div>{{ articleList.length }}</div>
      </div>
      <div class="base-info-card__info-item">
        <div>评论</div>
        <div>{{ commentList.length }}</div>
      </div>
      <div class="base-info-card__info-item">
        <div>分类</div>
        <div>{{ categoryList.length }}</div>
      </div>
      <div class="base-info-card__info-item">
        <div>标签</div>
        <div>{{ tagList.length }}</div>
      </div>
    </u-region>
  </u-layout>
</template>

<script lang="ts" setup>
import { useLeftSideStore } from '@/stores/leftSide'
import { useArticleStore } from '@/stores/model/article'
import { useCommentStore } from '@/stores/model/comment'
import { useCategoryStore } from '@/stores/model/category'
import { useTagStore } from '@/stores/model/tag'
import { storeToRefs } from 'pinia'

defineOptions({
  name: 'BaseInfoCard'
})

const { user } = storeToRefs(useLeftSideStore())
const { articleList } = storeToRefs(useArticleStore())
const { commentList } = storeToRefs(useCommentStore())
const { categoryList } = storeToRefs(useCategoryStore())
const { tagList } = storeToRefs(useTagStore())
</script>

<style scoped lang="scss">
.base-info-card {
  .base-info-card__info {
    display: flex;
    align-items: center;
    justify-content: space-around;
    &-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      gap: 0.4rem;
      font-size: 1.4rem;
      font-weight: 600;
      color: var(--uc-text-2);
    }
  }
  .u-region.base-info-card__avatar {
    width: 100%;
    img {
      width: 5rem;
      height: 5rem;
      border-radius: 50%;
      object-fit: cover;
    }
  }
}
</style>
