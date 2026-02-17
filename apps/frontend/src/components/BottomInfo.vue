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
        <u-button
          link
          tag="a"
          href="https://icp.gov.moe/?keyword=20251077"
          target="_blank"
          rel="noopener noreferrer"
          class="bottom-info__link"
        >
          {{ t('footer.icp') }}
        </u-button>
        <u-text class="bottom-info__separator">|</u-text>
        <u-button
          link
          tag="a"
          href="https://beian.miit.gov.cn/"
          target="_blank"
          rel="noopener noreferrer"
          class="bottom-info__link"
        >
          {{ footerStore.icp }}
        </u-button>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useFooterStore } from '@/stores/footer'

const { t } = useI18n()

defineOptions({
  name: 'BottomInfo'
})

const footerStore = useFooterStore()
</script>

<style lang="scss" scoped>
.bottom-info {
  width: 100%;
  min-height: 4.8rem;
  background-color: var(--u-background-1);
  border-top: 1px solid var(--u-border-1);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);

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
