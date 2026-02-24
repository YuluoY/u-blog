<template>
  <!-- 游客查看后台浮动入口按钮（仅在后台开启该功能时可见） -->
  <Transition name="guest-entry-fade">
    <div
      v-if="visible"
      class="guest-admin-entry"
      :title="t('guestAdmin.tooltip')"
      @click="handleOpen"
    >
      <u-icon icon="fa-solid fa-eye" />
      <span class="guest-admin-entry__text">{{ t('guestAdmin.label') }}</span>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getSettings } from '@/api/settings'
import { SETTING_KEYS } from '@/constants/settings'

defineOptions({ name: 'GuestAdminEntry' })

const { t } = useI18n()
const visible = ref(false)

/** 管理后台 URL（与 HeadNav 一致） */
const ADMIN_URL = import.meta.env.VITE_ADMIN_URL
  || (import.meta.env.PROD ? '/admin/' : 'http://localhost:5174')

/** 组件挂载时获取设置，判断是否显示入口 */
onMounted(async () => {
  try {
    const map = await getSettings([SETTING_KEYS.GUEST_ADMIN_VIEW_ENABLED])
    const raw = map[SETTING_KEYS.GUEST_ADMIN_VIEW_ENABLED]
    const val = raw?.value
    // 兼容 boolean / string / nested object
    let enabled = false
    if (val === true || val === 'true') enabled = true
    else if (val && typeof val === 'object' && 'value' in val) {
      const inner = (val as any).value
      enabled = inner === true || inner === 'true'
    }
    visible.value = enabled
  } catch {
    // 请求失败则不显示
  }
})

/** 点击打开游客模式后台 */
function handleOpen() {
  const url = ADMIN_URL.endsWith('/')
    ? `${ADMIN_URL}?guest=1`
    : `${ADMIN_URL}/?guest=1`
  window.open(url, '_blank')
}
</script>

<style lang="scss" scoped>
.guest-admin-entry {
  position: fixed;
  right: 20px;
  bottom: 168px;
  z-index: 99;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 20px;
  background: var(--u-color-primary, #7c3aed);
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.25s ease;
  user-select: none;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    background: var(--u-color-primary-dark, #6d28d9);
  }

  &:active {
    transform: translateY(0);
  }

  &__text {
    white-space: nowrap;
    font-weight: 500;
  }
}

/* 过渡动画 */
.guest-entry-fade-enter-active,
.guest-entry-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.guest-entry-fade-enter-from,
.guest-entry-fade-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* 移动端适配 */
@media (max-width: 767px) {
  .guest-admin-entry {
    right: 12px;
    bottom: 80px;
    padding: 6px 10px;
    font-size: 12px;

    &__text {
      display: none;
    }
  }
}
</style>
