<template>
  <footer class="bottom-info">
    <div class="bottom-info__container">
      <div class="bottom-info__left">
        <u-text class="bottom-info__copyright">
          Copyright &copy; {{ footerStore.siteYear }}
        </u-text>
        <u-text class="bottom-info__author">{{ footerStore.author }}</u-text>
      </div>
      <div class="bottom-info__right">
        <!-- 萌ICP -->
        <template v-if="footerStore.moeIcpVisible">
          <u-button
            link
            tag="a"
            :href="footerStore.moeIcpLink"
            target="_blank"
            rel="noopener noreferrer"
            class="bottom-info__link"
          >
            {{ footerStore.moeIcp }}
          </u-button>
        </template>
        <!-- 分隔符：仅当两者都可见时显示 -->
        <u-text
          v-if="footerStore.moeIcpVisible && footerStore.icpVisible"
          class="bottom-info__separator"
        >|</u-text>
        <!-- 备案号 -->
        <template v-if="footerStore.icpVisible">
          <u-button
            link
            tag="a"
            :href="footerStore.icpLink"
            target="_blank"
            rel="noopener noreferrer"
            class="bottom-info__link"
          >
            {{ footerStore.icp }}
          </u-button>
        </template>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { useFooterStore } from '@/stores/footer'

defineOptions({
  name: 'BottomInfo'
})

const footerStore = useFooterStore()

// App.vue 已统一加载 footer 设置，若未加载（容错）则自行拉取
if (!footerStore.loaded)

  footerStore.fetchFooterSettings()

</script>

<style lang="scss" scoped>
.bottom-info {
  width: 100%;
  min-height: 4.8rem;
  background-color: var(--u-background-1);
  border-top: 1px solid var(--u-border-1);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);

  /* 移动端隐藏 footer（copyright + 备案号），底部空间留给 MobileBottomNav */
  @media (max-width: 767px) {
    display: none;
  }

  &__container {
    max-width: 120rem;
    margin: 0 auto;
    padding: var(--app-shell-spacing-md, 16px) var(--app-shell-spacing-lg, 24px);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 1.6rem;
    @media (max-width: 768px) {
      flex-direction: column;
      text-align: center;
    }
    /* 移动端为固定的底部导航栏预留空间，防止 ICP 备案号被遮挡 */
    @media (max-width: 767px) {
      padding-bottom: calc(56px + env(safe-area-inset-bottom, 0px) + 16px);
    }
  }

  &__left,
  &__right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  &__copyright {
    font-size: 1.4rem;
    color: var(--u-text-2);
    line-height: 1.6;
  }

  &__author {
    font-weight: 500;
    color: var(--u-text-1);
  }

  &__link {
    font-size: 1.3rem;
    color: var(--u-text-2);
    text-decoration: none;
    transition: color 0.3s ease;
    white-space: nowrap;

    &:hover {
      color: var(--u-primary-0);
      text-decoration: underline;
    }

    &:active {
      opacity: 0.8;
    }
  }

  &__separator {
    color: var(--u-text-3);
    margin: 0 0.5rem;
    user-select: none;
  }
}

// 深色主题适配
[theme="dark"] {
  .bottom-info {
    border-top-color: var(--u-border-1);
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.3);

    &__copyright {
      color: var(--u-text-2);
    }

    &__author {
      color: var(--u-text-1);
    }

    &__link {
      color: var(--u-text-2);

      &:hover {
        color: var(--u-primary-0);
      }
    }

    &__separator {
      color: var(--u-text-3);
    }
  }
}
</style>
