<template>
  <u-layout class="home">
    <u-region region="center" class="home-content" ref="cardListRef">
      <div class="home-content__inner">
        <component
          :is="ArticleListStyles[appStore.articleListType]"
          :data="articleStore.articleList"
          @jump="handleJump"
        >
        </component>
      </div>
    </u-region>
  </u-layout>
</template>
<script setup lang="ts">
import ArticleListStyles from '@/components/ArticleListStyles'
import { useAppStore } from '@/stores/app'
import { useArticleStore } from '@/stores/model/article'
defineOptions({
  name: 'HomeView'
})
const appStore = useAppStore()
const articleStore = useArticleStore()
const router = useRouter()

const handleJump = (id: string) => router.push(`/read/${id}`)
</script>

<style scoped lang="scss">
.home-content {
  .home-content__inner {
    width: 100%;
    display: flex;
    align-items: center;
    flex-direction: column;
    .home-content__loading {
      width: 100%;
      margin: 2rem 0;
      display: flex;
      justify-content: center;
      align-items: center;
      .u-button {
        width: 100%;
      }
    }
  }
}
</style>
