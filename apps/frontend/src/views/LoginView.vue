<template>
  <div class="auth-page" :class="{ 'is-register': !isLogin }">
    <!-- ===== Mesh Gradient Aurora 背景 ===== -->
    <div class="auth-page__aurora">
      <div class="auth-page__aurora-orb auth-page__aurora-orb--1" />
      <div class="auth-page__aurora-orb auth-page__aurora-orb--2" />
      <div class="auth-page__aurora-orb auth-page__aurora-orb--3" />
      <div class="auth-page__aurora-orb auth-page__aurora-orb--4" />
      <div class="auth-page__aurora-noise" />
    </div>

    <!-- 返回首页 -->
    <router-link to="/home" class="auth-page__back">
      <u-icon icon="fa-solid fa-arrow-left" size="sm" />
      <span>{{ t('auth.backToHome') }}</span>
    </router-link>

    <!-- ===== 主容器 ===== -->
    <div class="auth-page__shell">
      <!-- 左侧品牌 -->
      <aside class="auth-page__brand">
        <div class="auth-page__brand-inner">
          <div class="auth-page__logo-ring">
            <div class="auth-page__logo">
              <u-icon icon="fa-solid fa-blog" size="2x" color="#fff" />
            </div>
          </div>
          <h1 class="auth-page__brand-name">U-Blog</h1>
          <p class="auth-page__brand-tagline">
            {{ isLogin ? t('auth.welcomeBackDesc') : t('auth.createAccountDesc') }}
          </p>
          <ul class="auth-page__features">
            <li><u-icon icon="fa-solid fa-pen-nib" size="xs" /><span>写作分享</span></li>
            <li><u-icon icon="fa-solid fa-comments" size="xs" /><span>交流互动</span></li>
            <li><u-icon icon="fa-solid fa-bookmark" size="xs" /><span>收藏归档</span></li>
          </ul>
        </div>
      </aside>

      <!-- 右侧表单 -->
      <main class="auth-page__main">
        <div class="auth-page__card">
          <!-- 标题 -->
          <header class="auth-page__header">
            <h2>{{ isLogin ? t('auth.welcomeBack') : t('auth.createAccount') }}</h2>
            <p>{{ isLogin ? t('auth.welcomeBackDesc') : t('auth.createAccountDesc') }}</p>
          </header>

          <!-- ====== 表单过渡 ====== -->
          <Transition name="auth-swap" mode="out-in">
            <!-- 登录 -->
            <u-form
              v-if="isLogin"
              key="login"
              ref="loginFormRef"
              :model="loginForm"
              :rules="loginRules"
              label-position="top"
              class="auth-page__form"
            >
              <u-form-item :label="t('auth.username')" prop="username" required>
                <u-input
                  v-model="loginForm.username"
                  :placeholder="t('auth.usernamePlaceholder')"
                  size="large"
                  prefix-icon="fa-solid fa-user"
                  clearable
                />
              </u-form-item>

              <u-form-item :label="t('auth.password')" prop="password" required>
                <u-input
                  v-model="loginForm.password"
                  type="password"
                  show-password
                  :placeholder="t('auth.passwordPlaceholder')"
                  size="large"
                  prefix-icon="fa-solid fa-lock"
                />
              </u-form-item>

              <u-button
                class="auth-page__submit"
                type="primary"
                size="large"
                :loading="loading"
                round
                @click="handleLogin"
              >
                {{ loading ? t('auth.logging') : t('auth.login') }}
              </u-button>
            </u-form>

            <!-- 注册 -->
            <u-form
              v-else
              key="register"
              ref="registerFormRef"
              :model="registerForm"
              :rules="registerRules"
              label-position="top"
              class="auth-page__form"
            >
              <u-form-item :label="t('auth.username')" prop="username" required>
                <u-input
                  v-model="registerForm.username"
                  :placeholder="t('auth.registerUsernamePlaceholder')"
                  size="large"
                  prefix-icon="fa-solid fa-user"
                  clearable
                />
              </u-form-item>

              <u-form-item :label="t('auth.email')" prop="email" required>
                <u-input
                  v-model="registerForm.email"
                  :placeholder="t('auth.emailPlaceholder')"
                  size="large"
                  prefix-icon="fa-solid fa-envelope"
                  clearable
                />
              </u-form-item>

              <!-- 邮箱验证码 -->
              <u-form-item :label="t('auth.emailCode')" prop="emailCode" required>
                <div class="auth-page__code-row">
                  <u-input
                    v-model="registerForm.emailCode"
                    :placeholder="t('auth.emailCodePlaceholder')"
                    size="large"
                    prefix-icon="fa-solid fa-shield-halved"
                    :maxLength="6"
                  />
                  <u-button
                    class="auth-page__code-btn"
                    :type="codeCooldown > 0 ? 'info' : 'primary'"
                    size="large"
                    :disabled="codeCooldown > 0 || sendingCode"
                    :loading="sendingCode"
                    round
                    @click="handleSendCode"
                  >
                    <template v-if="sendingCode">
                      {{ t('auth.sending') }}
                    </template>
                    <template v-else-if="codeCooldown > 0">
                      <!-- 倒计时环 -->
                      <svg class="auth-page__countdown-ring" viewBox="0 0 32 32">
                        <circle
                          cx="16" cy="16" r="14"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          :stroke-dasharray="87.96"
                          :stroke-dashoffset="87.96 * (1 - codeCooldown / 60)"
                        />
                      </svg>
                      <span>{{ codeCooldown }}s</span>
                    </template>
                    <template v-else>{{ t('auth.sendCode') }}</template>
                  </u-button>
                </div>
              </u-form-item>

              <u-form-item :label="t('auth.password')" prop="password" required>
                <u-input
                  v-model="registerForm.password"
                  type="password"
                  show-password
                  :placeholder="t('auth.passwordPlaceholder')"
                  size="large"
                  prefix-icon="fa-solid fa-lock"
                />
              </u-form-item>

              <u-form-item :label="t('auth.confirmPassword')" prop="confirmPassword" required>
                <u-input
                  v-model="registerForm.confirmPassword"
                  type="password"
                  show-password
                  :placeholder="t('auth.confirmPasswordPlaceholder')"
                  size="large"
                  prefix-icon="fa-solid fa-lock"
                />
              </u-form-item>

              <u-button
                class="auth-page__submit"
                type="primary"
                size="large"
                :loading="loading"
                round
                @click="handleRegister"
              >
                {{ loading ? t('auth.registering') : t('auth.register') }}
              </u-button>
            </u-form>
          </Transition>

          <!-- 错误提示 -->
          <Transition name="auth-toast">
            <div v-if="errorMsg" class="auth-page__toast auth-page__toast--error">
              <u-icon icon="fa-solid fa-circle-exclamation" size="sm" />
              <span>{{ errorMsg }}</span>
            </div>
          </Transition>

          <!-- 成功提示 -->
          <Transition name="auth-toast">
            <div v-if="successMsg" class="auth-page__toast auth-page__toast--success">
              <u-icon icon="fa-solid fa-circle-check" size="sm" />
              <span>{{ successMsg }}</span>
            </div>
          </Transition>

          <!-- 分割线 + 切换 -->
          <footer class="auth-page__footer">
            <span class="auth-page__divider-line" />
            <button class="auth-page__switch" @click="toggleMode">
              {{ isLogin ? t('auth.switchToRegister') : t('auth.switchToLogin') }}
            </button>
            <span class="auth-page__divider-line" />
          </footer>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/model/user'
import type { UFormExposes, FormRules } from '@u-blog/ui'

defineOptions({ name: 'LoginView' })

const { t } = useI18n({ useScope: 'global' })
const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

/* ---------- 状态 ---------- */
const isLogin = ref(true)
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')
const sendingCode = ref(false)
const codeCooldown = ref(0)
let cooldownTimer: ReturnType<typeof setInterval> | null = null

const loginFormRef = ref<UFormExposes | null>(null)
const registerFormRef = ref<UFormExposes | null>(null)

/* ---------- 表单 ---------- */
const loginForm = reactive({ username: '', password: '' })
const registerForm = reactive({
  username: '',
  email: '',
  emailCode: '',
  password: '',
  confirmPassword: '',
})

/* ---------- 校验规则 ---------- */
const loginRules = computed<FormRules>(() => ({
  username: [{ required: true, message: t('auth.usernameRequired'), trigger: 'blur' }],
  password: [
    { required: true, message: t('auth.passwordRequired'), trigger: 'blur' },
    { min: 6, message: t('auth.passwordMin'), trigger: 'blur' },
  ],
}))

const registerRules = computed<FormRules>(() => ({
  username: [{ required: true, message: t('auth.usernameRequired'), trigger: 'blur' }],
  email: [
    { required: true, message: t('auth.emailRequired'), trigger: 'blur' },
    { type: 'email', message: t('auth.emailInvalid'), trigger: 'blur' },
  ],
  emailCode: [
    { required: true, message: t('auth.emailCodeRequired'), trigger: 'blur' },
    { length: 6, message: t('auth.emailCodePlaceholder'), trigger: 'blur' },
  ],
  password: [
    { required: true, message: t('auth.passwordRequired'), trigger: 'blur' },
    { min: 6, message: t('auth.passwordMin'), trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: t('auth.confirmPasswordRequired'), trigger: 'blur' },
    {
      validator: (_rule, value) => {
        if (value !== registerForm.password) return Promise.reject(new Error(t('auth.passwordMismatch')))
        return Promise.resolve()
      },
      trigger: 'blur',
    },
  ],
}))

/* ---------- 方法 ---------- */
function clearMessages() {
  errorMsg.value = ''
  successMsg.value = ''
}

function toggleMode() {
  isLogin.value = !isLogin.value
  clearMessages()
}

function redirectAfterAuth() {
  const redirect = (route.query.redirect as string) || '/home'
  router.replace(redirect)
}

/** 自动清除消息 */
function flashError(msg: string) {
  errorMsg.value = msg
  setTimeout(() => { if (errorMsg.value === msg) errorMsg.value = '' }, 4000)
}

function flashSuccess(msg: string) {
  successMsg.value = msg
  setTimeout(() => { if (successMsg.value === msg) successMsg.value = '' }, 3000)
}

/** 发送邮箱验证码 */
async function handleSendCode() {
  if (codeCooldown.value > 0 || sendingCode.value) return
  if (!registerForm.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerForm.email)) {
    flashError(t('auth.emailInvalid'))
    return
  }
  sendingCode.value = true
  clearMessages()
  try {
    await userStore.sendEmailCode(registerForm.email)
    flashSuccess(t('auth.codeSentSuccess'))
    codeCooldown.value = 60
    cooldownTimer = setInterval(() => {
      codeCooldown.value--
      if (codeCooldown.value <= 0) {
        clearInterval(cooldownTimer!)
        cooldownTimer = null
      }
    }, 1000)
  } catch (e: any) {
    flashError(e.message || '发送失败')
  } finally {
    sendingCode.value = false
  }
}

/** 登录 */
async function handleLogin() {
  if (loading.value) return
  clearMessages()
  try { await loginFormRef.value?.validate() } catch { return }
  loading.value = true
  try {
    await userStore.login({ username: loginForm.username, password: loginForm.password })
    redirectAfterAuth()
  } catch (e: any) {
    flashError(e.message || t('common.error'))
  } finally {
    loading.value = false
  }
}

/** 注册 */
async function handleRegister() {
  if (loading.value) return
  clearMessages()
  try { await registerFormRef.value?.validate() } catch { return }
  loading.value = true
  try {
    await userStore.register({
      username: registerForm.username,
      email: registerForm.email,
      emailCode: registerForm.emailCode,
      password: registerForm.password,
      role: 'user',
      isActive: true,
    })
    redirectAfterAuth()
  } catch (e: any) {
    flashError(e.message || t('common.error'))
  } finally {
    loading.value = false
  }
}

onBeforeUnmount(() => { if (cooldownTimer) clearInterval(cooldownTimer) })
</script>

<style lang="scss" scoped>
/* =====================================================================
   Auth Page — Mesh Aurora + Glassmorphism
   ===================================================================== */

/* ---- 根容器 ---- */
.auth-page {
  --_accent: 217 92% 60%;
  --_accent-2: 250 76% 66%;
  --_glass-bg: rgba(255, 255, 255, 0.06);
  --_glass-border: rgba(255, 255, 255, 0.12);
  --_glass-blur: 24px;
  --_text-primary: #f0f2f5;
  --_text-secondary: rgba(240, 242, 245, 0.65);
  --_card-bg: rgba(15, 17, 25, 0.72);
  --_card-border: rgba(255, 255, 255, 0.08);
  --_transition-spring: cubic-bezier(0.16, 1, 0.3, 1);

  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #0a0b14;
  font-family: var(--u-font-family, 'Inter', system-ui, sans-serif);
}

/* ===================== Mesh Aurora Background ===================== */
.auth-page__aurora {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  filter: saturate(1.3);
}

.auth-page__aurora-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.55;
  will-change: transform;

  &--1 {
    width: 60vmax;
    height: 60vmax;
    top: -20%;
    left: -10%;
    background: radial-gradient(circle, hsl(217 92% 55% / 0.8), hsl(250 76% 52% / 0.3) 70%, transparent);
    animation: orbDrift1 22s ease-in-out infinite alternate;
  }
  &--2 {
    width: 50vmax;
    height: 50vmax;
    bottom: -25%;
    right: -10%;
    background: radial-gradient(circle, hsl(280 72% 52% / 0.7), hsl(320 68% 45% / 0.2) 70%, transparent);
    animation: orbDrift2 26s ease-in-out infinite alternate;
  }
  &--3 {
    width: 35vmax;
    height: 35vmax;
    top: 40%;
    left: 50%;
    background: radial-gradient(circle, hsl(190 90% 48% / 0.5), transparent 70%);
    animation: orbDrift3 20s ease-in-out infinite alternate;
  }
  &--4 {
    width: 25vmax;
    height: 25vmax;
    top: 10%;
    right: 20%;
    background: radial-gradient(circle, hsl(340 80% 55% / 0.35), transparent 70%);
    animation: orbDrift4 18s ease-in-out infinite alternate;
  }
}

/* 噪点纹理 — 消除塑料感 */
.auth-page__aurora-noise {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
  background-repeat: repeat;
  mix-blend-mode: overlay;
  opacity: 0.4;
  pointer-events: none;
}

/* 注册模式色彩偏移 */
.auth-page.is-register {
  .auth-page__aurora-orb--1 {
    background: radial-gradient(circle, hsl(280 72% 55% / 0.8), hsl(320 68% 52% / 0.3) 70%, transparent);
  }
  .auth-page__aurora-orb--3 {
    background: radial-gradient(circle, hsl(160 80% 46% / 0.5), transparent 70%);
  }
}

/* ===================== 返回按钮 ===================== */
.auth-page__back {
  position: absolute;
  top: 2.4rem;
  left: 2.4rem;
  z-index: 10;
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.8rem 1.4rem;
  border-radius: 10rem;
  background: var(--_glass-bg);
  backdrop-filter: blur(var(--_glass-blur));
  -webkit-backdrop-filter: blur(var(--_glass-blur));
  border: 1px solid var(--_glass-border);
  color: var(--_text-secondary);
  font-size: 1.3rem;
  text-decoration: none;
  transition: all 0.3s var(--_transition-spring);

  &:hover {
    color: var(--_text-primary);
    background: rgba(255, 255, 255, 0.12);
    transform: translateX(-3px);
  }
}

/* ===================== Shell 容器 ===================== */
.auth-page__shell {
  position: relative;
  z-index: 1;
  display: flex;
  width: min(88rem, 92vw);
  max-height: 92vh;
  border-radius: 2.4rem;
  overflow: hidden;
  border: 1px solid var(--_card-border);
  background: var(--_card-bg);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.05) inset,
    0 32px 64px rgba(0, 0, 0, 0.4),
    0 2px 8px rgba(0, 0, 0, 0.2);
  animation: shellEntry 0.7s var(--_transition-spring);
}

/* ===================== 左侧品牌面板 ===================== */
.auth-page__brand {
  flex: 0 0 38%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4.8rem 3.2rem;
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, transparent 100%);
  border-right: 1px solid var(--_card-border);
}

.auth-page__brand-inner {
  position: relative;
  z-index: 1;
  text-align: center;
  color: var(--_text-primary);
}

/* Logo 呼吸光环 */
.auth-page__logo-ring {
  width: 9rem;
  height: 9rem;
  margin: 0 auto 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: linear-gradient(135deg, hsl(var(--_accent) / 0.2), hsl(var(--_accent-2) / 0.15));
  border: 1px solid hsl(var(--_accent) / 0.3);
  position: relative;
  animation: breathe 4s ease-in-out infinite;

  &::before {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    background: conic-gradient(from 0deg, hsl(var(--_accent) / 0.3), hsl(var(--_accent-2) / 0.3), transparent, hsl(var(--_accent) / 0.3));
    animation: ringRotate 8s linear infinite;
    mask: radial-gradient(circle, transparent 54%, black 56%);
    -webkit-mask: radial-gradient(circle, transparent 54%, black 56%);
  }
}

.auth-page__logo {
  width: 5.6rem;
  height: 5.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 1.6rem;
  background: linear-gradient(135deg, hsl(var(--_accent)), hsl(var(--_accent-2)));
  box-shadow: 0 8px 24px hsl(var(--_accent) / 0.35);
}

.auth-page__brand-name {
  font-size: 3rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  margin-bottom: 0.8rem;
  background: linear-gradient(135deg, #fff 30%, rgba(255, 255, 255, 0.6));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.auth-page__brand-tagline {
  font-size: 1.35rem;
  color: var(--_text-secondary);
  line-height: 1.7;
  max-width: 26rem;
  margin: 0 auto 3.2rem;
}

.auth-page__features {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  li {
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 1.3rem;
    color: var(--_text-secondary);
    padding: 0.7rem 1.4rem;
    border-radius: 1rem;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.06);
    transition: all 0.3s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.08);
      color: var(--_text-primary);
      transform: translateX(4px);
    }
  }
}

/* ===================== 右侧表单 ===================== */
.auth-page__main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3.2rem;
  overflow-y: auto;
}

.auth-page__card {
  width: 100%;
  max-width: 40rem;
}

.auth-page__header {
  margin-bottom: 3.2rem;

  h2 {
    font-size: 2.6rem;
    font-weight: 700;
    color: var(--_text-primary);
    letter-spacing: -0.02em;
    margin-bottom: 0.6rem;
  }

  p {
    font-size: 1.35rem;
    color: var(--_text-secondary);
    line-height: 1.6;
  }
}

/* ---- 表单全局覆盖（深色 glass 适配） ---- */
.auth-page__form {
  :deep(.u-form-item__label) {
    color: var(--_text-secondary) !important;
    font-size: 1.25rem;
    font-weight: 500;
  }

  :deep(.u-form-item__required-star) {
    color: hsl(0 85% 62%) !important;
  }

  :deep(.u-input__wrapper) {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
    color: var(--_text-primary);
    transition: all 0.3s ease;

    &:hover {
      border-color: rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.07);
    }

    &:focus-within {
      border-color: hsl(var(--_accent));
      box-shadow: 0 0 0 3px hsl(var(--_accent) / 0.15);
      background: rgba(255, 255, 255, 0.08);
    }
  }

  :deep(.u-input__inner) {
    color: var(--_text-primary);
    caret-color: hsl(var(--_accent));

    &::placeholder {
      color: rgba(255, 255, 255, 0.3);
    }
  }

  :deep(.u-input__prefix),
  :deep(.u-input__suffix) {
    color: var(--_text-secondary);
  }

  :deep(.u-input__password),
  :deep(.u-input__clear) {
    color: var(--_text-secondary);
    &:hover {
      color: var(--_text-primary);
    }
  }

  :deep(.u-form-item__error) {
    font-size: 1.15rem;
    color: hsl(0 85% 62%);
  }

  :deep(.u-form-item--error .u-input__wrapper) {
    border-color: hsl(0 85% 55% / 0.6) !important;
    box-shadow: 0 0 0 3px hsl(0 85% 55% / 0.1);
  }

  :deep(.u-form-item) {
    margin-bottom: 2rem;
  }
}

/* ---- 提交按钮 ---- */
.auth-page__submit {
  width: 100%;
  margin-top: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  background: linear-gradient(135deg, hsl(var(--_accent)), hsl(var(--_accent-2))) !important;
  border: none !important;
  box-shadow: 0 4px 16px hsl(var(--_accent) / 0.3);
  transition: all 0.35s var(--_transition-spring) !important;

  &:hover:not(.is-disabled):not(.is-loading) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px hsl(var(--_accent) / 0.45) !important;
  }

  &:active {
    transform: translateY(0) !important;
  }
}

/* ---- 验证码行 ---- */
.auth-page__code-row {
  display: flex;
  gap: 0.8rem;
  width: 100%;
  align-items: stretch;

  .u-input { flex: 1; }
}

.auth-page__code-btn {
  flex-shrink: 0;
  min-width: 11rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  white-space: nowrap;
}

.auth-page__countdown-ring {
  width: 1.8rem;
  height: 1.8rem;
  transform: rotate(-90deg);
  flex-shrink: 0;
}

/* ---- Toast 提示 ---- */
.auth-page__toast {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-top: 1.6rem;
  padding: 1rem 1.4rem;
  border-radius: 1.2rem;
  font-size: 1.3rem;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  &--error {
    background: hsl(0 70% 50% / 0.12);
    color: hsl(0 85% 68%);
    border: 1px solid hsl(0 70% 50% / 0.2);
  }

  &--success {
    background: hsl(145 70% 42% / 0.12);
    color: hsl(145 75% 65%);
    border: 1px solid hsl(145 70% 42% / 0.2);
  }
}

/* ---- 底部切换 ---- */
.auth-page__footer {
  display: flex;
  align-items: center;
  gap: 1.4rem;
  margin-top: 2.8rem;
}

.auth-page__divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
}

.auth-page__switch {
  font-size: 1.3rem;
  color: hsl(var(--_accent));
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  font-weight: 500;
  background: none;
  border: none;
  padding: 0.4rem 0;
  transition: all 0.3s ease;

  &:hover {
    color: hsl(var(--_accent-2));
    text-shadow: 0 0 16px hsl(var(--_accent) / 0.5);
  }
}

/* ===================== Keyframes ===================== */

@keyframes orbDrift1 {
  0%   { transform: translate(0, 0) scale(1); }
  50%  { transform: translate(8vw, 5vh) scale(1.08); }
  100% { transform: translate(-5vw, 8vh) scale(0.95); }
}
@keyframes orbDrift2 {
  0%   { transform: translate(0, 0) scale(1); }
  50%  { transform: translate(-10vw, -4vh) scale(1.1); }
  100% { transform: translate(6vw, -8vh) scale(0.92); }
}
@keyframes orbDrift3 {
  0%   { transform: translate(0, 0) scale(1); }
  50%  { transform: translate(5vw, -6vh) scale(1.05); }
  100% { transform: translate(-8vw, 3vh) scale(0.98); }
}
@keyframes orbDrift4 {
  0%   { transform: translate(0, 0) scale(1); }
  50%  { transform: translate(-4vw, 6vh) scale(1.15); }
  100% { transform: translate(7vw, -3vh) scale(0.9); }
}

@keyframes breathe {
  0%, 100% { box-shadow: 0 0 20px hsl(var(--_accent) / 0.15); }
  50%      { box-shadow: 0 0 40px hsl(var(--_accent) / 0.3); }
}

@keyframes ringRotate {
  to { transform: rotate(360deg); }
}

@keyframes shellEntry {
  0% {
    opacity: 0;
    transform: scale(0.94) translateY(16px);
    filter: blur(6px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
    filter: blur(0);
  }
}

/* ===================== Transitions ===================== */

.auth-swap-enter-active,
.auth-swap-leave-active {
  transition: all 0.35s var(--_transition-spring);
}
.auth-swap-enter-from {
  opacity: 0;
  transform: translateY(16px) scale(0.98);
  filter: blur(4px);
}
.auth-swap-leave-to {
  opacity: 0;
  transform: translateY(-12px) scale(0.98);
  filter: blur(4px);
}

.auth-toast-enter-active,
.auth-toast-leave-active {
  transition: all 0.35s ease;
}
.auth-toast-enter-from,
.auth-toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ===================== Responsive ===================== */

@media (max-width: 768px) {
  .auth-page__shell {
    flex-direction: column;
    width: 95vw;
    max-height: 96vh;
    border-radius: 2rem;
  }

  .auth-page__brand {
    flex: 0 0 auto;
    padding: 2.4rem 2rem;
    border-right: none;
    border-bottom: 1px solid var(--_card-border);

    .auth-page__features { display: none; }
    .auth-page__brand-tagline { margin-bottom: 0; font-size: 1.25rem; }
    .auth-page__logo-ring { width: 6rem; height: 6rem; margin-bottom: 1.2rem; }
    .auth-page__logo { width: 3.8rem; height: 3.8rem; border-radius: 1.2rem; }
    .auth-page__brand-name { font-size: 2.2rem; }
  }

  .auth-page__main {
    padding: 2.4rem 2rem;
  }

  .auth-page__header {
    margin-bottom: 2.4rem;
    h2 { font-size: 2rem; }
  }

  .auth-page__back {
    top: 1.2rem;
    left: 1.2rem;
    padding: 0.6rem 1rem;
    font-size: 1.2rem;
  }
}

@media (max-width: 480px) {
  .auth-page__code-row {
    flex-direction: column;
  }
  .auth-page__code-btn {
    width: 100%;
    min-width: auto;
  }
}
</style>
