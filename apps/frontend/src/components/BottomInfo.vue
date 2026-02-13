<template>
  <div class="bottom-info">
    <div class="bottom-info__container">
      <div class="bottom-info__content">
        <div class="bottom-info__left">
          <div class="bottom-info__copyright">
            <span>Copyright &copy; {{ footerStore.siteYear }}</span>
            <span class="bottom-info__author">{{ footerStore.author }}</span>
          </div>
        </div>
        <div class="bottom-info__right">
          <div class="bottom-info__links">
            <a 
              href="https://icp.gov.moe/?keyword=20251077" 
              target="_blank" 
              rel="noopener noreferrer"
              class="bottom-info__link"
            >
              萌ICP备20251077号
            </a>
            <span class="bottom-info__separator">|</span>
            <a 
              href="https://beian.miit.gov.cn/" 
              target="_blank"
              rel="noopener noreferrer"
              class="bottom-info__link"
            >
              {{ footerStore.icp }}
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFooterStore } from '@/stores/footer'
defineOptions({
  name: 'BottomInfo'
})

const footerStore = useFooterStore()
</script>

<style lang="scss" scoped>
.bottom-info {
  width: 100%;
  min-height: 8rem;
  background-color: var(--uc-background-1);
  border-top: 1px solid var(--uc-border-color, rgba(0, 0, 0, 0.1));
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);

  &__container {
    max-width: 120rem;
    margin: 0 auto;
    padding: 2rem 1.6rem;
  }

  &__content {
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

  &__left {
    display: flex;
    align-items: center;
  }

  &__right {
    display: flex;
    align-items: center;
  }

  &__copyright {
    font-size: 1.4rem;
    color: var(--uc-text-2, #666);
    line-height: 1.6;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  &__author {
    font-weight: 500;
    color: var(--uc-text-1, #333);
  }

  &__links {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    font-size: 1.3rem;
  }

  &__link {
    color: var(--uc-text-2, #666);
    text-decoration: none;
    transition: color 0.3s ease;
    white-space: nowrap;

    &:hover {
      color: var(--uc-primary-color, #1890ff);
      text-decoration: underline;
    }

    &:active {
      opacity: 0.8;
    }
  }

  &__separator {
    color: var(--uc-text-3, #999);
    margin: 0 0.5rem;
    user-select: none;
  }
}

// 深色主题适配
[theme="dark"] {
  .bottom-info {
    border-top-color: rgba(255, 255, 255, 0.1);
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.3);

    &__copyright {
      color: var(--uc-text-2, rgba(255, 255, 255, 0.7));
    }

    &__author {
      color: var(--uc-text-1, rgba(255, 255, 255, 0.9));
    }

    &__link {
      color: var(--uc-text-2, rgba(255, 255, 255, 0.7));

      &:hover {
        color: var(--uc-primary-color, #4dabf7);
      }
    }

    &__separator {
      color: var(--uc-text-3, rgba(255, 255, 255, 0.5));
    }
  }
}
</style>
